from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User, UserRole
from app.models.communication import Announcement, SupportNotification
from app.utils.decorators import role_required, get_current_user
from datetime import datetime

announcements_bp = Blueprint('announcements', __name__)


# ─── Helper ───────────────────────────────────────────────────────────────────

def _notify(user_id, title, message, school_id=None):
    db.session.add(SupportNotification(
        user_id    = user_id,
        school_id  = school_id,
        title      = title,
        message    = message,
        notif_type = 'ANNOUNCEMENT',
    ))


def _get_school_id():
    return get_current_user().school_id


# ─── 1. Create Announcement ───────────────────────────────────────────────────

@announcements_bp.route('', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL')
def create_announcement():
    """
    POST /api/support/announcements
    Body: {
        title, body, audience, priority,
        is_pinned, scheduled_at, expires_at, product_type
    }
    audience: ALL | TEACHERS | STUDENTS | PARENTS | STAFF
    scheduled_at: ISO datetime string — NULL means publish now
    expires_at:   ISO datetime string — NULL means never expire
    """
    user      = get_current_user()
    school_id = user.school_id
    data      = request.get_json() or {}

    title = (data.get('title') or '').strip()
    body  = (data.get('body')  or '').strip()

    if not title:
        return jsonify({'error': 'title is required'}), 400
    if not body:
        return jsonify({'error': 'body is required'}), 400

    # Parse optional datetimes
    scheduled_at = None
    expires_at   = None
    try:
        if data.get('scheduled_at'):
            scheduled_at = datetime.fromisoformat(data['scheduled_at'])
    except ValueError:
        return jsonify({'error': 'scheduled_at format galat — ISO datetime chahiye'}), 400
    try:
        if data.get('expires_at'):
            expires_at = datetime.fromisoformat(data['expires_at'])
    except ValueError:
        return jsonify({'error': 'expires_at format galat — ISO datetime chahiye'}), 400

    ann = Announcement(
        school_id    = school_id,
        product_type = data.get('product_type', 'EduERP'),
        created_by   = user.id,
        creator_name = user.name,
        creator_role = user.role.value,
        title        = title,
        body         = body,
        audience     = (data.get('audience') or 'ALL').upper(),
        priority     = (data.get('priority') or 'MEDIUM').upper(),
        is_pinned    = bool(data.get('is_pinned', False)),
        is_active    = True,
        scheduled_at = scheduled_at,
        expires_at   = expires_at,
    )
    db.session.add(ann)
    db.session.flush()

    # ── Notify users if publishing NOW (no schedule) ──────────────────────────
    if not scheduled_at and school_id:
        _broadcast_notification(ann, school_id)

    db.session.commit()
    return jsonify(ann.to_dict()), 201


def _broadcast_notification(ann, school_id):
    """
    Announcement audience ke hisaab se sab relevant users ko notify karo.
    """
    audience = ann.audience  # ALL / TEACHERS / STUDENTS / PARENTS / STAFF

    role_map = {
        'ALL':      None,   # sab roles
        'TEACHERS': [UserRole.TEACHER, UserRole.VICE_PRINCIPAL],
        'STUDENTS': [UserRole.STUDENT],
        'PARENTS':  [UserRole.PARENT],
        'STAFF':    [UserRole.TEACHER, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST,
                     UserRole.LIBRARIAN, UserRole.HOSTEL, UserRole.TRANSPORT, UserRole.HR],
    }

    target_roles = role_map.get(audience)
    q = User.query.filter_by(school_id=school_id, is_active=True)

    if target_roles:
        q = q.filter(User.role.in_(target_roles))

    users = q.all()
    for u in users:
        _notify(
            user_id   = u.id,
            title     = f'📢 {ann.title}',
            message   = ann.body[:200] + ('...' if len(ann.body) > 200 else ''),
            school_id = school_id,
        )


# ─── 2. List Announcements ────────────────────────────────────────────────────

@announcements_bp.route('', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def list_announcements():
    """
    GET /api/support/announcements
    - Sirf active + published (scheduled_at <= now OR scheduled_at is NULL)
    - Expired announcements automatically hide ho jaati hain
    - Pinned announcements pehle aati hain
    Query params: audience, priority, page, per_page
    """
    user      = get_current_user()
    school_id = user.school_id
    now       = datetime.utcnow()

    q = Announcement.query.filter_by(is_active=True)

    # SUPER_ADMIN sab schools dekh sakta hai
    if user.role == UserRole.SUPER_ADMIN:
        if request.args.get('school_id'):
            q = q.filter_by(school_id=request.args.get('school_id', type=int))
        if request.args.get('product_type'):
            q = q.filter_by(product_type=request.args.get('product_type'))
    else:
        q = q.filter_by(school_id=school_id)

        # Audience filter — TEACHER sirf ALL+TEACHERS dekhega etc.
        role_audience_map = {
            UserRole.TEACHER:       ['ALL', 'TEACHERS', 'STAFF'],
            UserRole.VICE_PRINCIPAL:['ALL', 'TEACHERS', 'STAFF'],
            UserRole.STUDENT:       ['ALL', 'STUDENTS'],
            UserRole.PARENT:        ['ALL', 'PARENTS'],
            UserRole.ACCOUNTANT:    ['ALL', 'STAFF'],
            UserRole.RECEPTIONIST:  ['ALL', 'STAFF'],
            UserRole.LIBRARIAN:     ['ALL', 'STAFF'],
            UserRole.HOSTEL:        ['ALL', 'STAFF'],
            UserRole.TRANSPORT:     ['ALL', 'STAFF'],
            UserRole.HR:            ['ALL', 'STAFF'],
            UserRole.PRINCIPAL:     ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF'],
        }
        allowed = role_audience_map.get(user.role, ['ALL'])
        q = q.filter(Announcement.audience.in_(allowed))

    # Only published announcements (scheduled_at <= now OR null)
    q = q.filter(
        db.or_(
            Announcement.scheduled_at == None,
            Announcement.scheduled_at <= now,
        )
    )

    # Hide expired
    q = q.filter(
        db.or_(
            Announcement.expires_at == None,
            Announcement.expires_at > now,
        )
    )

    # Optional filters
    if request.args.get('priority'):
        q = q.filter_by(priority=request.args.get('priority').upper())
    if request.args.get('audience'):
        q = q.filter_by(audience=request.args.get('audience').upper())

    # Pinned pehle, phir latest
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    paginated = q.order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'data':     [a.to_dict() for a in paginated.items],
        'total':    paginated.total,
        'page':     paginated.page,
        'pages':    paginated.pages,
        'has_next': paginated.has_next,
    }), 200


# ─── 3. Announcement Detail ───────────────────────────────────────────────────

@announcements_bp.route('/<int:ann_id>', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def announcement_detail(ann_id):
    """GET /api/support/announcements/<id>"""
    ann = Announcement.query.get_or_404(ann_id)
    return jsonify(ann.to_dict()), 200


# ─── 4. Update Announcement ───────────────────────────────────────────────────

@announcements_bp.route('/<int:ann_id>', methods=['PATCH'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL')
def update_announcement(ann_id):
    """
    PATCH /api/support/announcements/<id>
    Edit title, body, audience, priority, pin, schedule, expire.
    """
    user = get_current_user()
    ann  = Announcement.query.get_or_404(ann_id)

    # Only creator ya SUPER_ADMIN edit kar sakta hai
    if user.role != UserRole.SUPER_ADMIN and ann.created_by != user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}

    if data.get('title')    is not None: ann.title    = data['title'].strip()
    if data.get('body')     is not None: ann.body     = data['body'].strip()
    if data.get('audience') is not None: ann.audience = data['audience'].upper()
    if data.get('priority') is not None: ann.priority = data['priority'].upper()
    if 'is_pinned'  in data:            ann.is_pinned = bool(data['is_pinned'])
    if 'is_active'  in data:            ann.is_active = bool(data['is_active'])

    if 'scheduled_at' in data:
        try:
            ann.scheduled_at = datetime.fromisoformat(data['scheduled_at']) \
                               if data['scheduled_at'] else None
        except ValueError:
            return jsonify({'error': 'scheduled_at format galat'}), 400

    if 'expires_at' in data:
        try:
            ann.expires_at = datetime.fromisoformat(data['expires_at']) \
                             if data['expires_at'] else None
        except ValueError:
            return jsonify({'error': 'expires_at format galat'}), 400

    ann.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(ann.to_dict()), 200


# ─── 5. Pin / Unpin ───────────────────────────────────────────────────────────

@announcements_bp.route('/<int:ann_id>/pin', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL')
def toggle_pin(ann_id):
    """POST /api/support/announcements/<id>/pin — toggle pin status."""
    ann          = Announcement.query.get_or_404(ann_id)
    ann.is_pinned = not ann.is_pinned
    ann.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({
        'message':   'Pinned' if ann.is_pinned else 'Unpinned',
        'is_pinned': ann.is_pinned,
    }), 200


# ─── 6. Delete / Deactivate Announcement ─────────────────────────────────────

@announcements_bp.route('/<int:ann_id>', methods=['DELETE'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL')
def delete_announcement(ann_id):
    """
    DELETE /api/support/announcements/<id>
    Soft delete — is_active = False.
    """
    user = get_current_user()
    ann  = Announcement.query.get_or_404(ann_id)

    if user.role != UserRole.SUPER_ADMIN and ann.created_by != user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    ann.is_active  = False
    ann.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Announcement removed'}), 200


# ─── 7. Broadcast Now (scheduled announcement manually publish karo) ──────────

@announcements_bp.route('/<int:ann_id>/broadcast', methods=['POST'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL')
def broadcast_now(ann_id):
    """
    POST /api/support/announcements/<id>/broadcast
    Scheduled announcement ko abhi broadcast karo.
    Notifications sab relevant users ko jaayengi.
    """
    user = get_current_user()
    ann  = Announcement.query.get_or_404(ann_id)

    if user.role != UserRole.SUPER_ADMIN and ann.created_by != user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not ann.school_id:
        return jsonify({'error': 'school_id missing on announcement'}), 400

    ann.scheduled_at = None   # publish now
    ann.is_active    = True
    ann.updated_at   = datetime.utcnow()

    _broadcast_notification(ann, ann.school_id)

    db.session.commit()
    return jsonify({'message': 'Announcement broadcasted to all relevant users'}), 200


# ─── 8. My School Announcements (dashboard widget ke liye) ───────────────────

@announcements_bp.route('/latest', methods=['GET'])
@role_required('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL',
               'TEACHER', 'STUDENT', 'PARENT',
               'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
               'HOSTEL', 'TRANSPORT', 'HR')
def latest_announcements():
    """
    GET /api/support/announcements/latest
    Dashboard widget ke liye — top 5 active announcements.
    Pinned pehle, phir latest.
    """
    user      = get_current_user()
    school_id = user.school_id
    now       = datetime.utcnow()

    q = Announcement.query.filter_by(
        school_id=school_id,
        is_active=True
    ).filter(
        db.or_(Announcement.scheduled_at == None, Announcement.scheduled_at <= now),
        db.or_(Announcement.expires_at   == None, Announcement.expires_at   >  now),
    ).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).limit(5)

    return jsonify([a.to_dict() for a in q.all()]), 200
