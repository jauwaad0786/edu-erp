from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User, UserRole


def role_required(*roles):
    """Decorator: restrict endpoint to given roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return jsonify({'error': 'Access denied'}), 403
            if user.role not in [UserRole(r) for r in roles]:
                return jsonify({'error': f'Role {user.role} not authorized'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    user_id = int(get_jwt_identity())   # ← add int()
    return User.query.get(user_id)
