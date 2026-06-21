from flask import Blueprint, request, jsonify
from app import limiter
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)

from sqlalchemy import text, func as sqlfunc
from app import db
from app.models.user import User, UserRole
from app.models.academic import Student

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():

    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter(
        sqlfunc.lower(User.email) == email
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({
            'error': 'Account deactivated'
        }), 403

    access_token = create_access_token(
        identity=str(user.id)
    )

    refresh_token = create_refresh_token(
        identity=str(user.id)
    )

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/student-login', methods=['POST'])
@limiter.limit("5 per minute")
def student_login():

    data = request.get_json() or {}

    phone       = (data.get('phone') or '').strip()
    name        = (data.get('name') or '').strip().lower()
    father_name = (data.get('father_name') or '').strip().lower()
    password    = data.get('password', '')

    candidates = Student.query.filter_by(parent_phone=phone).all()

    student = None
    for s in candidates:
        s_name   = (s.user.name if s.user else '').strip().lower()
        s_father = (s.father_name or '').strip().lower()
        if s_name == name and s_father == father_name:
            student = s
            break

    if not student:
        return jsonify({
            'error': 'Student not found'
        }), 404

    user = User.query.get(student.user_id)

    if not user or not user.check_password(password):
        return jsonify({
            'error': 'Invalid credentials'
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    refresh_token = create_refresh_token(
        identity=str(user.id)
    )

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()   # string as-is, don't convert
    access_token = create_access_token(
        identity=str(user_id)      # always keep as string
    )
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    data = request.get_json()

    old_pw = data.get('old_password', '')
    new_pw = data.get('new_password', '')

    if not user.check_password(old_pw):
        return jsonify({
            'error': 'Current password incorrect'
        }), 400

    user.set_password(new_pw)

    db.session.commit()

    return jsonify({
        'message': 'Password updated'
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password():
    """No OTP/SMS — user is told to contact the admin to reset their password."""
    return jsonify({
        'message': 'Password resets are currently handled by your administrator. Please contact your school/college admin to reset your password.'
    }), 200
