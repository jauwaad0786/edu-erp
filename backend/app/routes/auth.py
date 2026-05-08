from app.models.academic import Student
from sqlalchemy import func as sqlfunc
import random, time

# In-memory OTP store (replace with Redis/DB in production)
_otp_store = {}  # key: email_or_phone, value: {otp, expires}

# ── Student Login ─────────────────────────────────────────────────────────────
@auth_bp.route('/student-login', methods=['POST'])
def student_login():
    data        = request.get_json()
    name        = (data.get('name') or '').strip().lower()
    father_name = (data.get('father_name') or '').strip().lower()
    phone       = (data.get('phone') or '').strip()
    password    = data.get('password', '')

    # Find student by name + parent_name + parent_phone
    student = Student.query.filter(
        sqlfunc.lower(Student.parent_phone) == phone
    ).all()

    matched = None
    for s in student:
        s_name   = (s.name or '').lower()        if hasattr(s, 'name') else ''
        s_parent = (s.parent_name or '').lower()
        if name in s_name and father_name in s_parent:
            matched = s
            break

    if not matched:
        return jsonify({'error': 'Details se koi student nahi mila'}), 404

    user = User.query.get(matched.user_id)
    if not user:
        return jsonify({'error': 'Login account nahi bana hai. Principal se sampark karein.'}), 404

    if not user.check_password(password):
        return jsonify({'error': 'Password galat hai'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account deactivated. Principal se sampark karein.'}), 403

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user':          user.to_dict(),
    }), 200


# ── Forgot Password — Send OTP ────────────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.get_json()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    mode  = data.get('mode', 'staff')

    otp = str(random.randint(100000, 999999))
    expires = time.time() + 600  # 10 minutes

    if mode == 'student':
        student = Student.query.filter_by(parent_phone=phone).first()
        if not student:
            return jsonify({'error': 'Is mobile se koi student nahi mila'}), 404
        _otp_store[phone] = {'otp': otp, 'expires': expires}
        # TODO: SMS service integrate karein yahan
        print(f"[DEV] OTP for {phone}: {otp}")
        return jsonify({'message': 'OTP bheja gaya', 'otp_hint': otp}), 200  # otp_hint sirf dev ke liye
    else:
        user = User.query.filter(sqlfunc.lower(User.email) == email).first()
        if not user:
            return jsonify({'error': 'Is email se koi account nahi mila'}), 404
        _otp_store[email] = {'otp': otp, 'expires': expires}
        # TODO: Email service integrate karein yahan (e.g. Flask-Mail)
        print(f"[DEV] OTP for {email}: {otp}")
        return jsonify({'message': 'OTP bheja gaya', 'otp_hint': otp}), 200


# ── Verify OTP ────────────────────────────────────────────────────────────────
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data  = request.get_json()
    key   = data.get('email') or data.get('phone', '')
    otp   = data.get('otp', '')

    stored = _otp_store.get(key)
    if not stored:
        return jsonify({'error': 'OTP nahi mila ya expire ho gaya'}), 400
    if time.time() > stored['expires']:
        del _otp_store[key]
        return jsonify({'error': 'OTP expire ho gaya, dobara try karein'}), 400
    if stored['otp'] != otp:
        return jsonify({'error': 'OTP galat hai'}), 400

    return jsonify({'message': 'OTP verified'}), 200


# ── Reset Password ────────────────────────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data         = request.get_json()
    email        = data.get('email', '').strip().lower()
    phone        = data.get('phone', '').strip()
    otp          = data.get('otp', '')
    new_password = data.get('new_password', '')

    key = email or phone
    stored = _otp_store.get(key)
    if not stored or stored['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 400
    if time.time() > stored['expires']:
        return jsonify({'error': 'OTP expire ho gaya'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password kam se kam 6 characters ka hona chahiye'}), 400

    # Find user
    if email:
        user = User.query.filter(sqlfunc.lower(User.email) == email).first()
    else:
        student = Student.query.filter_by(parent_phone=phone).first()
        user = User.query.get(student.user_id) if student else None

    if not user:
        return jsonify({'error': 'User nahi mila'}), 404

    user.set_password(new_password)
    db.session.commit()
    del _otp_store[key]
    return jsonify({'message': 'Password reset ho gaya!'}), 200
