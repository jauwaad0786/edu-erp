# backend/app/routes/admin.py — FULL REPLACE

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func as sqlfunc
from datetime import datetime
from app import db
from app.models.user import User, UserRole
from app.models.school import School
from app.models.academic import Class
from app.models.financial import FeeRecord
from app.models.service_charge import ServiceCharge
from app.utils.decorators import role_required

admin_bp = Blueprint('admin', __name__)


# ─── Feature Catalog (reference only — actual enablement is per-school) ──────
FEATURE_CATALOG = [
    # key, label, tier
    {'key': 'up_to_200_students',   'label': 'Up to 200 Students',     'tier': 'BASIC'},
    {'key': 'single_admin',         'label': '1 Admin Account',        'tier': 'BASIC'},
    {'key': 'weekly_support',       'label': 'Weekly Support',         'tier': 'BASIC'},
    {'key': 'student_management',   'label': 'Student Management',     'tier': 'BASIC'},
    {'key': 'attendance_tracking',  'label': 'Attendance Tracking',    'tier': 'BASIC'},
    {'key': 'fee_management',       'label': 'Fee Management',         'tier': 'BASIC'},
    {'key': 'result_management',    'label': 'Result Management',      'tier': 'BASIC'},
    {'key': 'basic_reports',        'label': 'Basic Reports',          'tier': 'BASIC'},

    {'key': 'hrms_module',          'label': 'HRMS Module',            'tier': 'PROFESSIONAL'},
    {'key': 'multi_admin_3',        'label': '3 Admin Accounts',       'tier': 'PROFESSIONAL'},
    {'key': 'support_247',          'label': '24/7 Support',           'tier': 'PROFESSIONAL'},
    {'key': 'teacher_management',   'label': 'Teacher Management',     'tier': 'PROFESSIONAL'},
    {'key': 'payroll_system',       'label': 'Payroll System',         'tier': 'PROFESSIONAL'},
    {'key': 'advanced_analytics',   'label': 'Advanced Analytics',     'tier': 'PROFESSIONAL'},
    {'key': 'role_based_access',    'label': 'Role-based Access',      'tier': 'PROFESSIONAL'},

    {'key': 'whatsapp_notifications','label': 'WhatsApp Notifications','tier': 'ENTERPRISE'},
    {'key': 'multi_admin_5',        'label': '5 Admin Accounts',       'tier': 'ENTERPRISE'},
    {'key': 'priority_support_247', 'label': '24/7 Priority Support',  'tier': 'ENTERPRISE'},
    {'key': 'ai_reports',           'label': 'AI-powered Reports',     'tier': 'ENTERPRISE'},
    {'key': 'cloud_erp_dashboard',  'label': 'Cloud ERP Dashboard',    'tier': 'ENTERPRISE'},
    {'key': 'custom_integrations',  'label': 'Custom Integrations',    'tier': 'ENTERPRISE'},
    {'key': 'advanced_security',    'label': 'Advanced Security',      'tier': 'ENTERPRISE'},
    {'key': 'real_time_alerts',     'label': 'Real-time Alerts',       'tier': 'ENTERPRISE'},
]

PLAN_PRESETS = {
    'BASIC':        [f['key'] for f in FEATURE_CATALOG if f['tier'] == 'BASIC'],
    'PROFESSIONAL': [f['key'] for f in FEATURE_CATALOG if f['tier'] in ('BASIC', 'PROFESSIONAL')],
    'ENTERPRISE':   [f['key'] for f in FEATURE_CATALOG],   # everything
}


@admin_bp.route('/features/catalog', methods=['GET'])
@role_required('SUPER_ADMIN')
def get_feature_catalog():
    return jsonify({'catalog': FEATURE_CATALOG, 'presets': PLAN_PRESETS}), 200

# ─── Schools ──────────────────────────────────────────────────────────────────

@admin_bp.route('/schools', methods=['GET'])
@role_required('SUPER_ADMIN')
def list_schools():
    schools = School.query.all()
    this_month = datetime.utcnow().replace(day=1)
    result = []
    for s in schools:
        d = s.to_dict()
        # total students for chart
        d['total_students'] = User.query.filter_by(
            school_id=s.id, role=UserRole.STUDENT
        ).count()
        # service charge paid this month
        charges = ServiceCharge.query.filter_by(school_id=s.id).all()
        d['paid_this_month'] = any(
            c for c in charges
            if c.charge_date >= this_month and c.is_paid
        )
        result.append(d)
    return jsonify(result), 200


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

    default_classes = [
        'Nursery','LKG','UKG',
        'Class 1','Class 2','Class 3','Class 4','Class 5',
        'Class 6','Class 7','Class 8','Class 9',
        'Class 10','Class 11','Class 12'
    ]
    for class_name in default_classes:
        db.session.add(Class(
            name=class_name,
            section='A',
            session=school.current_session,
            school_id=school.id
        ))
    db.session.commit()
    return jsonify({
        'message': 'School created with default classes',
        'school': school.to_dict()
    }), 201


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
        'total_students':  total_students,
        'total_teachers':  total_teachers,
        'total_classes':   total_classes,
        'fees_collected':  total_paid,
        'fees_pending':    total_due - total_paid,
        'service_charges': [c.to_dict() for c in charges],
        'paid_this_month': paid_this_month,
    }), 200


@admin_bp.route('/schools/<int:school_id>', methods=['PUT'])
@role_required('SUPER_ADMIN')
def update_school(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()
    for field in ['name', 'address', 'city', 'state', 'phone', 'email', 'current_session', 'is_active', 'plan']:
        if field in data:
            setattr(school, field, data[field])
    db.session.commit()
    return jsonify(school.to_dict()), 200

@admin_bp.route('/schools/<int:school_id>/features', methods=['PUT'])
@role_required('SUPER_ADMIN')
def update_school_features(school_id):
    """
    Set the exact list of enabled feature keys for a school.
    Body: { features: ['student_management', 'hrms_module', ...] }
    This is fully manual/override — independent of plan label.
    """
    school = School.query.get_or_404(school_id)
    data = request.get_json() or {}
    features = data.get('features', [])

    valid_keys = {f['key'] for f in FEATURE_CATALOG}
    features = [f for f in features if f in valid_keys]   # sanitize

    school.set_features(features)
    if 'plan' in data:
        school.plan = data['plan']
    db.session.commit()
    return jsonify(school.to_dict()), 200


@admin_bp.route('/schools/<int:school_id>/features/apply-preset', methods=['POST'])
@role_required('SUPER_ADMIN')
def apply_plan_preset(school_id):
    """Quick-fill: apply a plan's default feature set (still editable after)."""
    school = School.query.get_or_404(school_id)
    data = request.get_json() or {}
    plan = data.get('plan', 'BASIC')
    if plan not in PLAN_PRESETS:
        return jsonify({'error': 'Invalid plan'}), 400
    school.plan = plan
    school.set_features(PLAN_PRESETS[plan])
    db.session.commit()
    return jsonify(school.to_dict()), 200


@admin_bp.route('/schools/<int:school_id>/toggle', methods=['PUT'])
@role_required('SUPER_ADMIN')
def toggle_school(school_id):
    school = School.query.get_or_404(school_id)
    school.is_active = not school.is_active
    db.session.commit()
    return jsonify({
        'is_active': school.is_active,
        'message': f"School {'activated' if school.is_active else 'deactivated'}"
    }), 200


# ─── Service Charges ──────────────────────────────────────────────────────────

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


# ─── Users ────────────────────────────────────────────────────────────────────

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


# ─── Stats ────────────────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@role_required('SUPER_ADMIN')
def admin_stats():
    return jsonify({
        'total_schools':  School.query.filter_by(is_active=True).count(),
        'total_users':    User.query.count(),
        'total_students': User.query.filter_by(role=UserRole.STUDENT).count(),
        'total_teachers': User.query.filter_by(role=UserRole.TEACHER).count(),
    }), 200
