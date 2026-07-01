from flask import Blueprint, request, jsonify
from app import db
from app.models.financial import FeeRecord
from app.models.finance import Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS
from app.utils.decorators import role_required, get_current_user
from sqlalchemy import func, extract
from datetime import date, datetime
import cloudinary.uploader

finance_bp = Blueprint('finance', __name__)


def _school_id():
    return get_current_user().school_id


def _month_label(d):
    """date object -> 'July 2026' — FeeRecord.month se hi consistent format"""
    return d.strftime('%B %Y')


def _month_bounds(month_str):
    """'July 2026' -> (year, month_number). Return None agar invalid."""
    try:
        parsed = datetime.strptime(month_str, '%B %Y')
        return parsed.year, parsed.month
    except (ValueError, TypeError):
        return None


# ─── Expenses — CRUD ────────────────────────────────────────────────────────

@finance_bp.route('/expenses', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_expenses():
    sid      = _school_id()
    month    = request.args.get('month')       # "July 2026"
    category = request.args.get('category')
    status   = request.args.get('status')
    source   = request.args.get('source')

    q = Expense.query.filter_by(school_id=sid)
    if month:
        q = q.filter_by(month=month)
    if category:
        q = q.filter_by(category=category)
    if status:
        q = q.filter_by(status=status)
    if source:
        q = q.filter_by(source=source)

    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)
    paginated = q.order_by(Expense.payment_date.desc(), Expense.created_at.desc())\
                  .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'data':     [e.to_dict() for e in paginated.items],
        'total':    paginated.total,
        'page':     paginated.page,
        'pages':    paginated.pages,
        'has_next': paginated.has_next,
    }), 200


@finance_bp.route('/expenses', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_expense():
    """
    Body: { category, title, vendor_name, amount, invoice_number,
            payment_method, payment_date, status, remarks }
    """
    data = request.get_json() or {}

    category = data.get('category')
    title    = (data.get('title') or '').strip()
    amount   = data.get('amount')

    if category not in EXPENSE_CATEGORIES:
        return jsonify({'error': f'Invalid category. Allowed: {EXPENSE_CATEGORIES}'}), 400
    if not title:
        return jsonify({'error': 'title zaroori hai'}), 400
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a number'}), 400
    if amount <= 0:
        return jsonify({'error': 'amount 0 se zyada hona chahiye'}), 400

    pay_date = date.fromisoformat(data['payment_date']) if data.get('payment_date') else date.today()

    exp = Expense(
        school_id      = _school_id(),
        category       = category,
        title          = title,
        vendor_name    = (data.get('vendor_name') or '').strip(),
        amount         = amount,
        invoice_number = (data.get('invoice_number') or '').strip(),
        payment_method = data.get('payment_method', 'CASH'),
        payment_date   = pay_date,
        month          = _month_label(pay_date),
        status         = data.get('status', 'PAID'),
        source         = 'MANUAL',
        remarks        = data.get('remarks', ''),
        created_by     = get_current_user().id,
    )
    db.session.add(exp)
    db.session.commit()
    return jsonify(exp.to_dict()), 201


@finance_bp.route('/expenses/<int:exp_id>', methods=['PATCH'])
@role_required('PRINCIPAL')
def update_expense(exp_id):
    exp = Expense.query.get_or_404(exp_id)
    if exp.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}
    if data.get('category') and data['category'] in EXPENSE_CATEGORIES:
        exp.category = data['category']
    if data.get('title'):
        exp.title = data['title'].strip()
    if 'vendor_name' in data:
        exp.vendor_name = (data['vendor_name'] or '').strip()
    if data.get('amount'):
        try:
            exp.amount = float(data['amount'])
        except (TypeError, ValueError):
            return jsonify({'error': 'amount must be a number'}), 400
    if 'invoice_number' in data:
        exp.invoice_number = (data['invoice_number'] or '').strip()
    if data.get('payment_method'):
        exp.payment_method = data['payment_method']
    if data.get('payment_date'):
        exp.payment_date = date.fromisoformat(data['payment_date'])
        exp.month        = _month_label(exp.payment_date)
    if data.get('status'):
        exp.status = data['status']
    if 'remarks' in data:
        exp.remarks = data['remarks']

    db.session.commit()
    return jsonify(exp.to_dict()), 200


@finance_bp.route('/expenses/<int:exp_id>', methods=['DELETE'])
@role_required('PRINCIPAL')
def delete_expense(exp_id):
    exp = Expense.query.get_or_404(exp_id)
    if exp.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(exp)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'}), 200


@finance_bp.route('/expenses/<int:exp_id>/bill', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def upload_expense_bill(exp_id):
    exp = Expense.query.get_or_404(exp_id)
    if exp.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    file = request.files.get('bill')
    if not file:
        return jsonify({'error': 'File nahi mila — field name: bill'}), 400

    result = cloudinary.uploader.upload(
        file,
        folder='eduerp/expenses',
        public_id=f'expense_{exp_id}',
        overwrite=True,
        resource_type='auto',
    )
    exp.bill_url = result['secure_url']
    db.session.commit()
    return jsonify({'bill_url': exp.bill_url}), 200


# ─── Category-wise Summary (for pie chart) ──────────────────────────────────

@finance_bp.route('/expenses/summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def expense_category_summary():
    sid   = _school_id()
    month = request.args.get('month')

    q = db.session.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count'),
    ).filter(Expense.school_id == sid)

    if month:
        q = q.filter(Expense.month == month)

    rows  = q.group_by(Expense.category).all()
    total = sum(r.total for r in rows) or 0

    return jsonify({
        'month': month,
        'total_expense': total,
        'categories': [
            {
                'category': r.category,
                'amount':   r.total,
                'count':    r.count,
                'pct':      round(r.total / total * 100, 1) if total else 0,
            }
            for r in sorted(rows, key=lambda r: r.total, reverse=True)
        ],
    }), 200


# ─── Profit & Loss — the core "iss month kitna profit hua" endpoint ─────────

@finance_bp.route('/profit-summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def profit_summary():
    """
    Query param: month=July 2026 (default: current month)

    Revenue  = FeeRecord.amount_paid jinka paid_date is month mein hai
               (Note: partial/installment payments approximate ho sakte hain —
               accurate ledger ke liye FeeTransaction table chahiye, abhi
               paid_date-based approximation use ho raha hai)
    Expenses = Expense.amount jinka month field match karta hai
    Profit   = Revenue - Expenses
    """
    sid   = _school_id()
    month = request.args.get('month') or _month_label(date.today())

    bounds = _month_bounds(month)
    if not bounds:
        return jsonify({'error': 'month format "July 2026" jaisa hona chahiye'}), 400
    year, month_num = bounds

    revenue = db.session.query(func.sum(FeeRecord.amount_paid))\
        .filter(
            FeeRecord.school_id == sid,
            FeeRecord.paid_date.isnot(None),
            extract('year',  FeeRecord.paid_date) == year,
            extract('month', FeeRecord.paid_date) == month_num,
        ).scalar() or 0

    expenses = db.session.query(func.sum(Expense.amount))\
        .filter(Expense.school_id == sid, Expense.month == month).scalar() or 0

    salary_expense = db.session.query(func.sum(Expense.amount))\
        .filter(
            Expense.school_id == sid, Expense.month == month,
            Expense.category.in_(['TEACHER_SALARY', 'STAFF_SALARY']),
        ).scalar() or 0

    profit = revenue - expenses

    return jsonify({
        'month':           month,
        'revenue':         revenue,
        'expenses':        expenses,
        'salary_expense':  salary_expense,
        'profit':          profit,
        'profit_margin_pct': round(profit / revenue * 100, 1) if revenue else 0,
        'expense_ratio_pct': round(expenses / revenue * 100, 1) if revenue else 0,
        'salary_pct_of_expense': round(salary_expense / expenses * 100, 1) if expenses else 0,
    }), 200


# ─── Monthly Trend (for line/bar charts — last N months) ────────────────────

@finance_bp.route('/monthly-trend', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def monthly_trend():
    """Query param: months=6 (default 6) -> last N months revenue/expense/profit"""
    sid    = _school_id()
    n      = min(request.args.get('months', 6, type=int), 24)

    today  = date.today()
    months = []
    y, m = today.year, today.month
    for _ in range(n):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months.reverse()

    result = []
    for (y, m) in months:
        label = date(y, m, 1).strftime('%B %Y')

        revenue = db.session.query(func.sum(FeeRecord.amount_paid))\
            .filter(
                FeeRecord.school_id == sid,
                FeeRecord.paid_date.isnot(None),
                extract('year',  FeeRecord.paid_date) == y,
                extract('month', FeeRecord.paid_date) == m,
            ).scalar() or 0

        expenses = db.session.query(func.sum(Expense.amount))\
            .filter(Expense.school_id == sid, Expense.month == label).scalar() or 0

        result.append({
            'month':    label,
            'revenue':  revenue,
            'expenses': expenses,
            'profit':   revenue - expenses,
        })

    return jsonify(result), 200


@finance_bp.route('/meta', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def finance_meta():
    """Frontend dropdowns ke liye category/payment-method list."""
    return jsonify({
        'categories':      EXPENSE_CATEGORIES,
        'payment_methods': PAYMENT_METHODS,
    }), 200
