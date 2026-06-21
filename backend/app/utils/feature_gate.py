from functools import wraps
from flask import jsonify
from app.models.school import School
from app.utils.decorators import get_current_user


def feature_required(feature_key):
    """
    Decorator: blocks the route with 403 if the user's school doesn't
    have this feature enabled. SUPER_ADMIN always passes (no school_id).
    Usage:
        @feature_required('hrms_module')
        def some_route(): ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user or not user.school_id:
                return fn(*args, **kwargs)   # super admin / no school = no gate

            school = School.query.get(user.school_id)
            if not school or not school.has_feature(feature_key):
                return jsonify({
                    'error': 'feature_locked',
                    'feature': feature_key,
                    'message': 'Yeh service abhi active nahi hai. Apne admin se upgrade karne ko kaho.'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
