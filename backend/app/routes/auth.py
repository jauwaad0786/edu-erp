from flask import Blueprint, request, jsonify
from flask_jwt_extended import (create_access_token, create_refresh_token,
                                 jwt_required, get_jwt_identity)
from app import db
from app.models.user import User, UserRole

auth_bp = Blueprint('auth', __name__)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)

from sqlalchemy import text

from app import db
from app.models.user import User, UserRole

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():

    print("\n========== LOGIN DEBUG START ==========\n")

    # DB CHECK
    try:
        with db.engine.connect() as conn:

            # CURRENT DATABASE
            result = conn.execute(text("SELECT DATABASE()"))
            print("CURRENT DATABASE:", result.fetchone())

            # SHOW TABLES
            tables = conn.execute(text("SHOW TABLES"))
            print("\nTABLES:")
            for table in tables:
                print(table)

            # CHECK USERS TABLE
            users = conn.execute(
                text("SELECT id,email,password FROM users")
            )

            print("\nUSERS TABLE DATA:")
            for u in users:
                print(u)

    except Exception as e:
        print("\nDB CONNECTION ERROR:")
        print(str(e))

    # REQUEST DATA
    data = request.get_json()

    print("\nREQUEST DATA:", data)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    print("EMAIL:", email)
    print("PASSWORD:", password)

    # QUERY USER
    from sqlalchemy import func

    user = User.query.filter(
        func.lower(User.email) == email.lower()
    ).first()

    print("\nUSER FOUND:", user)

    if user:
        print("DB EMAIL:", user.email)
        print("DB HASH:", user.password)

        result = user.check_password(password)

        print("PASSWORD MATCH:", result)

    print("\n========== LOGIN DEBUG END ==========\n")

    # LOGIN LOGIC
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({
            'error': 'Account deactivated. Contact admin.'
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




@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = int(get_jwt_identity())
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()
    old_pw = data.get('old_password', '')
    new_pw = data.get('new_password', '')
    if not user.check_password(old_pw):
        return jsonify({'error': 'Current password incorrect'}), 400
    if len(new_pw) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    user.set_password(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'}), 200
