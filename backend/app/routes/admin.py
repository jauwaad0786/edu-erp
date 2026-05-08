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
