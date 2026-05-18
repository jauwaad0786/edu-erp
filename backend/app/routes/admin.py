from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User, UserRole
from app.models.school import School
from app.models.academic import Class
from app.utils.decorators import role_required

admin_bp = Blueprint('admin', __name__)


# ─── Schools ─────────────────────────────────────────────────────────────────

@admin_bp.route('/schools', methods=['GET'])
@role_required('SUPER_ADMIN')
def list_schools():
    schools = School.query.all()
    return jsonify([s.to_dict() for s in schools]), 200


@admin_bp.route('/schools', methods=['POST'])
@role_required('SUPER_ADMIN')
def create_school():

    data = request.get_json()

    school = School(
        name=data['name'],
        code=data['code'].upper(),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        pincode=data.get('pincode'),
        phone=data.get('phone'),
        email=data.get('email'),
        type=data.get('type', 'SCHOOL'),
        current_session=data.get('current_session', '2024-25')
    )

    db.session.add(school)
    db.session.flush()

    # DEFAULT CLASSES
    default_classes = [
        'Nursery',
        'LKG',
        'UKG',
        'Class 1',
        'Class 2',
        'Class 3',
        'Class 4',
        'Class 5',
        'Class 6',
        'Class 7',
        'Class 8',
        'Class 9',
        'Class 10',
        'Class 11',
        'Class 12'
    ]

    for class_name in default_classes:

        cls = Class(
            name=class_name,
            section='A',
            session=school.current_session,
            school_id=school.id
        )

        db.session.add(cls)

    db.session.commit()

    return jsonify({
        'message': 'School created with default classes',
        'school': school.to_dict()
    }), 201


@admin_bp.route('/schools/<int:school_id>', methods=['PUT'])
@role_required('SUPER_ADMIN')
def update_school(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()
    for field in ['name', 'address', 'city', 'state', 'phone', 'email', 'current_session', 'is_active']:
        if field in data:
            setattr(school, field, data[field])
    db.session.commit()
    return jsonify(school.to_dict()), 200


# ─── User / Role Management ───────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@role_required('SUPER_ADMIN')
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route('/users', methods=['POST'])
@role_required('SUPER_ADMIN')
def create_user():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    user = User(
        name=data['name'],
        email=data['email'].lower(),
        role=UserRole(data['role']),
        school_id=data.get('school_id'),
        phone=data.get('phone')
    )
    user.set_password(data.get('password', 'EduErp@123'))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.route('/users/<int:user_id>/toggle', methods=['PUT'])
@role_required('SUPER_ADMIN')
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({'is_active': user.is_active}), 200


@admin_bp.route('/stats', methods=['GET'])
@role_required('SUPER_ADMIN')
def admin_stats():
    return jsonify({
        'total_schools':  School.query.filter_by(is_active=True).count(),
        'total_users':    User.query.count(),
        'total_students': User.query.filter_by(role=UserRole.STUDENT).count(),
        'total_teachers': User.query.filter_by(role=UserRole.TEACHER).count(),
    }), 200
# ── admin.py ke END mein add karo (existing code mat chhedo) ──

from app.models.financial import FeeRecord   # already hoga
from sqlalchemy import func as sqlfunc
from datetime import datetime


# ─── School Detail with Stats ─────────────────────────────────────────────────

@admin_bp.route('/schools/<int:school_id>', methods=['GET'])
@role_required('SUPER_ADMIN')
def get_school_detail(school_id):
    school = School.query.get_or_404(school_id)

    total_students = User.query.filter_by(
        school_id=school_id, role=UserRole.STUDENT
    ).count()

    total_teachers = User.query.filter_by(
        school_id=school_id, role=UserRole.TEACHER
    ).count()

    total_classes = Class.query.filter_by(school_id=school_id).count()

    # Fee stats
    fee_records = FeeRecord.query.join(
        User, FeeRecord.student_id == User.id
    ).filter(User.school_id == school_id).all()

    total_due  = sum(r.amount_due  for r in fee_records)
    total_paid = sum(r.amount_paid for r in fee_records)

    # Service charges
    charges = ServiceCharge.query.filter_by(school_id=school_id)\
                .order_by(ServiceCharge.charge_date.desc()).all()

    this_month = datetime.utcnow().replace(day=1)
    paid_this_month = any(
        c for c in charges
        if c.charge_date >= this_month and c.is_paid
    )

    return jsonify({
        **school.to_dict(),
        'total_students':    total_students,
        'total_teachers':    total_teachers,
        'total_classes':     total_classes,
        'fees_collected':    total_paid,
        'fees_pending':      total_due - total_paid,
        'service_charges':   [c.to_dict() for c in charges],
        'paid_this_month':   paid_this_month,
    }), 200


# ─── Activate / Deactivate School ────────────────────────────────────────────

@admin_bp.route('/schools/<int:school_id>/toggle', methods=['PUT'])
@role_required('SUPER_ADMIN')
def toggle_school(school_id):
    school = School.query.get_or_404(school_id)
    school.is_active = not school.is_active
    db.session.commit()
    return jsonify({
        'is_active': school.is_active,
        'message':   f"School {'activated' if school.is_active else 'deactivated'}"
    }), 200


# ─── Service Charges ─────────────────────────────────────────────────────────

@admin_bp.route('/schools/<int:school_id>/service-charges', methods=['GET'])
@role_required('SUPER_ADMIN')
def get_service_charges(school_id):
    School.query.get_or_404(school_id)
    charges = ServiceCharge.query.filter_by(school_id=school_id)\
                .order_by(ServiceCharge.charge_date.desc()).all()
    return jsonify([c.to_dict() for c in charges]), 200


@admin_bp.route('/schools/<int:school_id>/service-charges', methods=['POST'])
@role_required('SUPER_ADMIN')
def add_service_charge(school_id):
    School.query.get_or_404(school_id)
    data = request.get_json()

    charge = ServiceCharge(
        school_id=school_id,
        amount=data['amount'],
        label=data.get('label', 'Monthly Service Charge'),
        charge_date=datetime.strptime(data['charge_date'], '%Y-%m-%d')
                    if data.get('charge_date') else datetime.utcnow(),
        is_paid=data.get('is_paid', False),
        note=data.get('note', '')
    )
    db.session.add(charge)
    db.session.commit()
    return jsonify(charge.to_dict()), 201


@admin_bp.route('/service-charges/<int:charge_id>/toggle-paid', methods=['PUT'])
@role_required('SUPER_ADMIN')
def toggle_charge_paid(charge_id):
    charge = ServiceCharge.query.get_or_404(charge_id)
    charge.is_paid = not charge.is_paid
    db.session.commit()
    return jsonify(charge.to_dict()), 200
