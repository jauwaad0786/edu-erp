
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

import random
import time

auth_bp = Blueprint('auth', __name__)



# In-memory OTP store
_otp_store = {}


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

    data = request.get_json()

    phone = (data.get('phone') or '').strip()
    password = data.get('password', '')

    student = Student.query.filter_by(
        parent_phone=phone
    ).first()

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

    user_id = int(get_jwt_identity())

    access_token = create_access_token(
        identity=user_id
    )

    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():

    user_id = int(get_jwt_identity())

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

from werkzeug.security import generate_password_hash

@auth_bp.route('/reset-test')
def reset_test():

    user = User.query.filter_by(
        email='hammadbinirshad12407@gmail.com'
    ).first()

    if not user:
        return {"error": "user not found"}, 404

    user.password = generate_password_hash('Admin@123')

    db.session.commit()

    return {
        "message": "password reset done",
        "email": user.email
    }, 200
