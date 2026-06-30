from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.communication import (
    SupportTicket, TicketReply, SupportAttachment,
    SupportNotification, SupportPlan, SupportUsage
)
from app.utils.decorators import role_required, get_current_user

from datetime import datetime, date
import random, string
import cloudinary.uploader

tickets_bp = Blueprint('tickets', __name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _gen_ticket_no():
    """TKT-20260624-AB12 format."""
    today  = date.today().strftime('%Y%m%d')
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TKT-{today}-{suffix}"


def _get_school_id():
    return get_current_user().school_id


def _get_school_name(school_id):
    """School name fetch karo — denormalized store ke liye."""
    if not school_id:
        return ''
    try:
        from app.models.school import School
        s = School.query.get(school_id)
        return s.name if s else ''
    except Exception:
        return ''


def _get_plan(school_id):
    """School ka current support plan — BASIC ya PREMIUM."""
    plan = SupportPlan.query.filter_by(school_id=school_id).first()
    if not plan:
        return 'BASIC'
    if not plan.is_active:
        return 'BASIC'
    if plan.expires_at and plan.expires_at < datetime.utcnow():
        return 'BASIC'
    return plan.plan


def _check_weekly_limit(school_id):
    """
    BASIC plan: sirf 1 ticket per week allowed.
    Returns (allowed: bool, used: int, limit: int)
    """
    plan = _get_plan(school_id)
    if plan == 'PREMIUM':
        return True, 0, 999

    week_key = date.today().strftime('%Y-W%W')
    usage = SupportUsage.query.filter_by(
        school_id=school_id, week_key=week_key
    ).first()
    used = usage.ticket_count if usage else 0
    limit = 1  # BASIC plan limit

    return used < limit, used, limit


def _increment_usage(school_id):
    """Weekly ticket count +1."""
    week_key = date.today().strftime('%Y-W%W')
    usage = SupportUsage.query.filter_by(
        school_id=school_id, week_key=week_key
    ).first()
    if usage:
        usage.ticket_count += 1
    else:
        usage = SupportUsage(
            school_id=school_id,
            week_key=week_key,
            ticket_count=1
        )
        db.session.add(usage)


def _notify(user_id, title, message, ticket_id=None,
            school_id=None, notif_type='TICKET'):
    """Single notification row insert."""
    n = SupportNotification(
        user_id    = user_id,
        ticket_id  = ticket_id,
        school_id  = school_id,
        title      = title,
        message    = message,
        notif_type = notif_type,
    )
    db.session.add(n)


# ─── 1. Create Ticket ─────────────────────────────────────────────────────────

@tickets_bp.route('', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def create_ticket():
    """
    POST /api/support/tickets
    Koi bhi logged-in user ticket raise kar sakta hai.
    BASIC plan: sirf 1 ticket/week. PREMIUM: unlimited.
    """
    user      = get_current_user()
    school_id = user.school_id

    # ── Weekly limit check (BASIC plan) ──────────────────────────────────────
    if school_id:
        allowed, used, limit = _check_weekly_limit(school_id)
        if not allowed:
            plan = _get_plan(school_id)
            return jsonify({
                'error':        'weekly_limit_reached',
                'plan':         plan,
                'used':         used,
                'limit':        limit,
                'message':      (
                    f'Aapne is hafte ka support limit ({limit} ticket) use kar liya hai. '
                    'Premium Support upgrade karo unlimited assistance ke liye.'
                ),
                'upgrade_cta':  True,   # frontend pe upgrade card dikhana hai
            }), 429

    data = request.get_json() or {}

    # ── Required field validation ─────────────────────────────────────────────
    subject = (data.get('subject') or '').strip()
    if not subject:
        return jsonify({'error': 'subject is required'}), 400

    # ── Ticket number unique generate karo ───────────────────────────────────
    while True:
        tno = _gen_ticket_no()
        if not SupportTicket.query.filter_by(ticket_no=tno).first():
            break

    school_name = _get_school_name(school_id)

    ticket = SupportTicket(
        ticket_no        = tno,
        product_type     = data.get('product_type', 'EduERP'),
        school_id        = school_id,
        school_name      = school_name,
        raised_by        = user.id,
        raiser_name      = user.name,
        raiser_role      = user.role.value,
        category         = data.get('category', 'GENERAL'),
        subject          = subject,
        description      = data.get('description', ''),
        module_name      = data.get('module_name', ''),
        send_to          = data.get('send_to', 'ERP_SUPPORT'),
        priority         = data.get('priority', 'MEDIUM'),
        status           = 'OPEN',
    )
    db.session.add(ticket)
    db.session.flush()   # ticket.id milega

    # ── Usage counter update ──────────────────────────────────────────────────
    if school_id:
        _increment_usage(school_id)

    # ── Notify SUPER_ADMIN / assigned engineer ────────────────────────────────
    admins = User.query.filter_by(role=UserRole.SUPER_ADMIN).all()
    for admin in admins:
        _notify(
            user_id    = admin.id,
            title      = f'New Ticket: {tno}',
            message    = f'{school_name} — {subject} [{ticket.priority}]',
            ticket_id  = ticket.id,
            school_id  = school_id,
            notif_type = 'TICKET',
        )

    # ── Notify the raiser (confirmation) ─────────────────────────────────────
    _notify(
        user_id    = user.id,
        title      = f'Ticket Raised: {tno}',
        message    = 'Aapka ticket successfully submit ho gaya. Hum jald respond karenge.',
        ticket_id  = ticket.id,
        school_id  = school_id,
        notif_type = 'TICKET',
    )

    db.session.commit()
    return jsonify(ticket.to_dict()), 201


# ─── 2. List My Tickets ───────────────────────────────────────────────────────

@tickets_bp.route('', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def list_tickets():
    """
    GET /api/support/tickets
    - SUPER_ADMIN: sab schools ke sab tickets (developer dashboard)
    - Others: sirf apne school ke apne tickets
    Query params: status, priority, category, product_type, school_id (admin only),
                  page, per_page, search
    """
    user = get_current_user()
    q    = SupportTicket.query

    # ── Scope ─────────────────────────────────────────────────────────────────
    if user.role == UserRole.SUPER_ADMIN:
        # Admin sab dekh sakta hai — filters optional
        if request.args.get('school_id'):
            q = q.filter_by(school_id=request.args.get('school_id', type=int))
        if request.args.get('product_type'):
            q = q.filter_by(product_type=request.args.get('product_type'))
    else:
        # Normal user: sirf apne tickets
        q = q.filter_by(raised_by=user.id)

    # ── Common Filters ────────────────────────────────────────────────────────
    if request.args.get('status'):
        q = q.filter_by(status=request.args.get('status'))
    if request.args.get('priority'):
        q = q.filter_by(priority=request.args.get('priority'))
    if request.args.get('category'):
        q = q.filter_by(category=request.args.get('category'))

    # ── Search (subject ya ticket_no) ─────────────────────────────────────────
    search = (request.args.get('search') or '').strip()
    if search:
        like = f'%{search}%'
        q = q.filter(
            db.or_(
                SupportTicket.subject.ilike(like),
                SupportTicket.ticket_no.ilike(like),
                SupportTicket.school_name.ilike(like),
            )
        )

    # ── Pagination ────────────────────────────────────────────────────────────
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    paginated = q.order_by(
        SupportTicket.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'data':     [t.to_dict() for t in paginated.items],
        'total':    paginated.total,
        'page':     paginated.page,
        'pages':    paginated.pages,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev,
    }), 200


# ─── 3. Ticket Detail ─────────────────────────────────────────────────────────

@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def ticket_detail(ticket_id):
    """
    GET /api/support/tickets/<id>
    Full ticket + all replies + attachments.
    """
    user   = get_current_user()
    ticket = SupportTicket.query.get_or_404(ticket_id)

    # ── Access check ──────────────────────────────────────────────────────────
    if user.role != UserRole.SUPER_ADMIN:
        if ticket.raised_by != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

    # ── Replies ───────────────────────────────────────────────────────────────
    replies_q = TicketReply.query.filter_by(ticket_id=ticket_id)

    # Internal notes sirf SUPER_ADMIN dekhega
    if user.role != UserRole.SUPER_ADMIN:
        replies_q = replies_q.filter_by(is_internal=False)

    replies = replies_q.order_by(TicketReply.created_at.asc()).all()

    replies_data = []
    for r in replies:
        d = r.to_dict()
        # Attachments of this reply
        d['attachments'] = [
            a.to_dict() for a in
            SupportAttachment.query.filter_by(reply_id=r.id).all()
        ]
        replies_data.append(d)

    # ── Ticket attachments ────────────────────────────────────────────────────
    attachments = SupportAttachment.query.filter_by(
        ticket_id=ticket_id, reply_id=None
    ).all()

    result = ticket.to_dict()
    result['replies']     = replies_data
    result['attachments'] = [a.to_dict() for a in attachments]

    return jsonify(result), 200


# ─── 4. Reply to Ticket ───────────────────────────────────────────────────────

@tickets_bp.route('/<int:ticket_id>/reply', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def reply_ticket(ticket_id):
    """
    POST /api/support/tickets/<id>/reply
    Body: { message, is_internal (admin only) }
    """
    user   = get_current_user()
    ticket = SupportTicket.query.get_or_404(ticket_id)

    # Access check
    if user.role != UserRole.SUPER_ADMIN:
        if ticket.raised_by != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

    data    = request.get_json() or {}
    message = (data.get('message') or '').strip()
    if not message:
        return jsonify({'error': 'message is required'}), 400

    # is_internal sirf SUPER_ADMIN set kar sakta hai
    is_internal = bool(data.get('is_internal', False)) \
                  if user.role == UserRole.SUPER_ADMIN else False

    reply = TicketReply(
        ticket_id  = ticket_id,
        replied_by = user.id,
        reply_name = user.name,
        reply_role = user.role.value,
        message    = message,
        is_internal= is_internal,
    )
    db.session.add(reply)

    # ── Auto status update ────────────────────────────────────────────────────
    if user.role == UserRole.SUPER_ADMIN:
        # Developer ne reply kiya → status IN_PROGRESS
        if ticket.status == 'OPEN':
            ticket.status = 'IN_PROGRESS'
    else:
        # User ne reply kiya → WAITING (developer response ka wait)
        if ticket.status in ('IN_PROGRESS', 'WAITING'):
            ticket.status = 'WAITING'

    ticket.updated_at = datetime.utcnow()
    db.session.flush()

    # ── Notifications ─────────────────────────────────────────────────────────
    if user.role == UserRole.SUPER_ADMIN:
        # Raiser ko batao — developer ne reply kiya
        _notify(
            user_id    = ticket.raised_by,
            title      = f'Reply on Ticket {ticket.ticket_no}',
            message    = f'Support team ne aapke ticket pe reply kiya hai.',
            ticket_id  = ticket_id,
            school_id  = ticket.school_id,
            notif_type = 'TICKET',
        )
    else:
        # Admin ko batao — user ne reply kiya
        admins = User.query.filter_by(role=UserRole.SUPER_ADMIN).all()
        for admin in admins:
            _notify(
                user_id    = admin.id,
                title      = f'User Reply: {ticket.ticket_no}',
                message    = f'{user.name} ({user.role.value}) ne reply kiya.',
                ticket_id  = ticket_id,
                school_id  = ticket.school_id,
                notif_type = 'TICKET',
            )

    db.session.commit()
    return jsonify(reply.to_dict()), 201


# ─── 5. Assign Ticket (SUPER_ADMIN only) ─────────────────────────────────────

@tickets_bp.route('/<int:ticket_id>/assign', methods=['POST'])
@role_required('SUPER_ADMIN')
def assign_ticket(ticket_id):
    """
    POST /api/support/tickets/<id>/assign
    Body: { engineer_id }
    Ticket kisi engineer ko assign karo.
    """
    ticket = SupportTicket.query.get_or_404(ticket_id)
    data   = request.get_json() or {}

    engineer_id = data.get('engineer_id')
    if not engineer_id:
        return jsonify({'error': 'engineer_id required'}), 400

    engineer = User.query.get_or_404(engineer_id)

    ticket.assigned_to  = engineer_id
    ticket.assigned_at  = datetime.utcnow()
    ticket.status       = 'IN_PROGRESS'
    ticket.updated_at   = datetime.utcnow()

    # Engineer ko notify karo
    _notify(
        user_id    = engineer_id,
        title      = f'Ticket Assigned: {ticket.ticket_no}',
        message    = f'{ticket.school_name} — {ticket.subject}',
        ticket_id  = ticket_id,
        school_id  = ticket.school_id,
        notif_type = 'TICKET',
    )

    db.session.commit()
    return jsonify({
        'message':      f'Ticket assigned to {engineer.name}',
        'ticket':       ticket.to_dict(),
    }), 200


# ─── 6. Update Status (SUPER_ADMIN only) ──────────────────────────────────────

# ── NEW ──
@tickets_bp.route('/<int:ticket_id>/status', methods=['PATCH'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def update_ticket_status(ticket_id):
    """
    PATCH /api/support/tickets/<id>/status
    Body: { status, resolution_notes (optional) }
    Valid: OPEN | PENDING | IN_PROGRESS | WAITING | RESOLVED | CLOSED | REJECTED

    SUPER_ADMIN: koi bhi status set kar sakta hai.
    Ticket raiser (non-admin): sirf apna khud ka ticket, sirf CLOSED ya OPEN (reopen) kar sakta hai.
    """
    ticket = SupportTicket.query.get_or_404(ticket_id)
    data   = request.get_json() or {}
    user   = get_current_user()

    valid_statuses = {
        'OPEN', 'PENDING', 'IN_PROGRESS',
        'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'
    }
    new_status = (data.get('status') or '').upper()
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Valid: {valid_statuses}'}), 400

    # ── Non-admin access control ──────────────────────────────────────────────
    if user.role != UserRole.SUPER_ADMIN:
        if ticket.raised_by != user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if new_status not in ('CLOSED', 'OPEN'):
            return jsonify({'error': 'Aap sirf ticket close ya reopen kar sakte ho'}), 403

    old_status    = ticket.status
    ticket.status = new_status

    if data.get('resolution_notes'):
        ticket.resolution_notes = data['resolution_notes']

    if new_status in ('RESOLVED', 'CLOSED'):
        ticket.resolved_at = datetime.utcnow()
        ticket.resolved_by = user.id

    ticket.updated_at = datetime.utcnow()

    # Raiser ko notify karo status change ke baare mein
    status_messages = {
        'RESOLVED':    'Aapka ticket resolve ho gaya hai. Please confirm karo.',
        'CLOSED':      'Ticket closed kar diya gaya hai.',
        'REJECTED':    'Ticket reject kar diya gaya. Details ke liye ticket open karo.',
        'IN_PROGRESS': 'Aapka ticket par kaam shuru ho gaya hai.',
        'WAITING':     'Hum aapke response ka intezaar kar rahe hain.',
    }
    msg = status_messages.get(new_status, f'Ticket status: {new_status}')

    _notify(
        user_id    = ticket.raised_by,
        title      = f'Ticket {ticket.ticket_no} — {new_status}',
        message    = msg,
        ticket_id  = ticket_id,
        school_id  = ticket.school_id,
        notif_type = 'TICKET',
    )

    db.session.commit()
    return jsonify({
        'message':    f'Status changed: {old_status} → {new_status}',
        'ticket':     ticket.to_dict(),
    }), 200


# ─── 7. Upload Attachment ─────────────────────────────────────────────────────

@tickets_bp.route('/<int:ticket_id>/attachment', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def upload_attachment(ticket_id):
    """
    POST /api/support/tickets/<id>/attachment
    multipart/form-data — field: 'file'
    Optional form field: reply_id (attach to a specific reply)
    """
    user   = get_current_user()
    ticket = SupportTicket.query.get_or_404(ticket_id)

    if user.role != UserRole.SUPER_ADMIN:
        if ticket.raised_by != user.id:
            return jsonify({'error': 'Unauthorized'}), 403

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'file required — field name: file'}), 400

    reply_id = request.form.get('reply_id', type=int)

    # ── Cloudinary upload ─────────────────────────────────────────────────────
    result = cloudinary.uploader.upload(
        file,
        folder       = f'eduerp/support/ticket_{ticket_id}',
        resource_type= 'auto',   # image + pdf + doc sab
        overwrite    = False,
    )

    # File type detect karo
    content_type = file.content_type or ''
    if 'image' in content_type:
        ftype = 'IMAGE'
    elif 'pdf' in content_type:
        ftype = 'PDF'
    elif 'word' in content_type or 'document' in content_type:
        ftype = 'DOCUMENT'
    else:
        ftype = 'OTHER'

    attachment = SupportAttachment(
        ticket_id   = ticket_id,
        reply_id    = reply_id,
        uploaded_by = user.id,
        file_url    = result['secure_url'],
        file_name   = file.filename or '',
        file_type   = ftype,
        file_size   = result.get('bytes', 0),
    )
    db.session.add(attachment)
    db.session.commit()

    return jsonify(attachment.to_dict()), 201


# ─── 8. Developer Dashboard Summary (SUPER_ADMIN only) ────────────────────────

@tickets_bp.route('/dashboard/summary', methods=['GET'])
@role_required('SUPER_ADMIN')
def developer_dashboard():
    """
    GET /api/support/tickets/dashboard/summary
    Cards: Open, Pending, Resolved, Critical, Today's tickets.
    Filterable by product_type.
    """
    from sqlalchemy import func, case as sa_case

    product_type = request.args.get('product_type')
    q = SupportTicket.query
    if product_type:
        q = q.filter_by(product_type=product_type)

    total    = q.count()
    open_c   = q.filter(SupportTicket.status == 'OPEN').count()
    pending  = q.filter(SupportTicket.status.in_(
                    ['PENDING', 'IN_PROGRESS', 'WAITING'])).count()
    resolved = q.filter(SupportTicket.status.in_(
                    ['RESOLVED', 'CLOSED'])).count()
    critical = q.filter(SupportTicket.priority == 'CRITICAL').count()

    today    = date.today()
    today_c  = q.filter(
        db.func.date(SupportTicket.created_at) == today
    ).count()

    # Per-product breakdown
    from sqlalchemy import func
    product_breakdown = db.session.query(
        SupportTicket.product_type,
        func.count(SupportTicket.id).label('count'),
    ).group_by(SupportTicket.product_type).all()

    # Per-school breakdown (top 10)
    school_breakdown = db.session.query(
        SupportTicket.school_name,
        SupportTicket.school_id,
        func.count(SupportTicket.id).label('count'),
    ).group_by(
        SupportTicket.school_name,
        SupportTicket.school_id,
    ).order_by(func.count(SupportTicket.id).desc()).limit(10).all()

    return jsonify({
        'summary': {
            'total':    total,
            'open':     open_c,
            'pending':  pending,
            'resolved': resolved,
            'critical': critical,
            'today':    today_c,
        },
        'by_product': [
            {'product_type': r.product_type, 'count': r.count}
            for r in product_breakdown
        ],
        'by_school': [
            {
                'school_id':   r.school_id,
                'school_name': r.school_name,
                'count':       r.count,
            }
            for r in school_breakdown
        ],
    }), 200


# ─── 9. Support Plan Info ─────────────────────────────────────────────────────

@tickets_bp.route('/my-plan', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def my_support_plan():
    """
    GET /api/support/tickets/my-plan
    Apna plan + weekly usage dekho.
    """
    user      = get_current_user()
    school_id = user.school_id

    plan_name = _get_plan(school_id) if school_id else 'BASIC'
    week_key  = date.today().strftime('%Y-W%W')

    usage = SupportUsage.query.filter_by(
        school_id=school_id, week_key=week_key
    ).first() if school_id else None

    used  = usage.ticket_count if usage else 0
    limit = 1 if plan_name == 'BASIC' else 999

    plan_obj = SupportPlan.query.filter_by(school_id=school_id).first() \
               if school_id else None

    return jsonify({
        'plan':          plan_name,
        'week_key':      week_key,
        'used_this_week':used,
        'limit':         limit,
        'remaining':     max(0, limit - used),
        'is_premium':    plan_name == 'PREMIUM',
        'expires_at':    plan_obj.expires_at.isoformat()
                         if plan_obj and plan_obj.expires_at else None,
        'upgrade_price': 299,   # ₹299/month
        'upgrade_benefits': [
            'Unlimited support requests',
            'Priority response',
            'Same day support',
            'Video meetings',
            'WhatsApp support',
            'Remote desktop assistance',
        ],
    }), 200


# ─── 10. Upgrade to Premium (SUPER_ADMIN activates for a school) ──────────────

@tickets_bp.route('/upgrade', methods=['POST'])
@role_required('SUPER_ADMIN')
def upgrade_plan():
    """
    POST /api/support/tickets/upgrade
    Body: { school_id, plan, months (default 1) }
    SUPER_ADMIN manually activate kare Premium Support for a school.
    """
    data      = request.get_json() or {}
    school_id = data.get('school_id')
    plan      = (data.get('plan') or 'PREMIUM').upper()
    months    = int(data.get('months', 1))

    if not school_id:
        return jsonify({'error': 'school_id required'}), 400

    from datetime import timedelta
    expires = datetime.utcnow() + timedelta(days=30 * months)

    existing = SupportPlan.query.filter_by(school_id=school_id).first()
    if existing:
        existing.plan       = plan
        existing.is_active  = True
        existing.expires_at = expires
        existing.amount     = 299 * months
        existing.updated_at = datetime.utcnow()
    else:
        sp = SupportPlan(
            school_id  = school_id,
            plan       = plan,
            is_active  = True,
            amount     = 299 * months,
            expires_at = expires,
        )
        db.session.add(sp)

    # Notify school principal
    from app.models.user import UserRole as UR
    principal = User.query.filter_by(
        school_id=school_id, role=UR.PRINCIPAL
    ).first()
    if principal:
        _notify(
            user_id    = principal.id,
            title      = '🎉 Premium Support Activated!',
            message    = (
                f'Aapka Premium Support {months} month(s) ke liye activate ho gaya. '
                'Ab aap unlimited support requests raise kar sakte hain.'
            ),
            school_id  = school_id,
            notif_type = 'SYSTEM',
        )

    db.session.commit()
    return jsonify({
        'message':    f'Plan upgraded to {plan} for {months} month(s)',
        'school_id':  school_id,
        'expires_at': expires.isoformat(),
    }), 200
