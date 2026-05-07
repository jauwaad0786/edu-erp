from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models.academic import Attendance, Marks, Note, Student, Class
from app.utils.decorators import role_required, get_current_user
from datetime import date
import os

teacher_bp = Blueprint('teacher', __name__)


# ─── Attendance ───────────────────────────────────────────────────────────────

@teacher_bp.route('/attendance', methods=['POST'])
@role_required('TEACHER')
def mark_attendance():
    """Mark attendance for entire class for a date."""
    data = request.get_json()
    class_id    = data['class_id']
    att_date    = date.fromisoformat(data['date'])
    records     = data['records']   # [{'student_id': 1, 'status': 'PRESENT'}, ...]
    user        = get_current_user()

    for rec in records:
        existing = Attendance.query.filter_by(student_id=rec['student_id'], date=att_date).first()
        if existing:
            existing.status = rec['status']
        else:
            a = Attendance(student_id=rec['student_id'], class_id=class_id,
                           date=att_date, status=rec['status'], marked_by=user.id)
            db.session.add(a)
    db.session.commit()
    return jsonify({'message': f'Attendance marked for {len(records)} students'}), 200


@teacher_bp.route('/attendance/<int:class_id>', methods=['GET'])
@role_required('TEACHER')
def get_attendance(class_id):
    att_date = request.args.get('date', str(date.today()))
    records = Attendance.query.filter_by(class_id=class_id, date=att_date).all()
    return jsonify([r.to_dict() for r in records]), 200


@teacher_bp.route('/attendance/monthly/<int:student_id>', methods=['GET'])
@role_required('TEACHER', 'PRINCIPAL')
def monthly_attendance(student_id):
    month = request.args.get('month')  # e.g. "2024-04"
    records = Attendance.query.filter_by(student_id=student_id).all()
    if month:
        records = [r for r in records if str(r.date).startswith(month)]
    total   = len(records)
    present = sum(1 for r in records if r.status == 'PRESENT')
    return jsonify({
        'total_days': total, 'present': present,
        'absent': total - present,
        'percentage': round(present / total * 100, 1) if total else 0,
        'records': [r.to_dict() for r in records]
    }), 200


# ─── Marks ────────────────────────────────────────────────────────────────────

@teacher_bp.route('/marks', methods=['POST'])
@role_required('TEACHER')
def enter_marks():
    """Enter marks for multiple students."""
    data    = request.get_json()
    user    = get_current_user()
    entries = data['entries']  # [{'student_id':1,'subject_id':2,'marks_obtained':85,'max_marks':100}, ...]
    exam_type = data.get('exam_type', 'Mid Term')

    for e in entries:
        existing = Marks.query.filter_by(
            student_id=e['student_id'], subject_id=e['subject_id'], exam_type=exam_type).first()
        if existing:
            existing.marks_obtained = e['marks_obtained']
            existing.grade = _grade(e['marks_obtained'], e['max_marks'])
        else:
            m = Marks(student_id=e['student_id'], subject_id=e['subject_id'],
                      exam_type=exam_type, marks_obtained=e['marks_obtained'],
                      max_marks=e['max_marks'], grade=_grade(e['marks_obtained'], e['max_marks']),
                      entered_by=user.id)
            db.session.add(m)
    db.session.commit()
    return jsonify({'message': f'{len(entries)} marks saved'}), 200


@teacher_bp.route('/marks/<int:class_id>', methods=['GET'])
@role_required('TEACHER', 'PRINCIPAL')
def get_marks(class_id):
    exam_type = request.args.get('exam_type')
    students = Student.query.filter_by(class_id=class_id).all()
    result = []
    for s in students:
        q = Marks.query.filter_by(student_id=s.id)
        if exam_type:
            q = q.filter_by(exam_type=exam_type)
        result.append({'student': s.to_dict(), 'marks': [m.to_dict() for m in q.all()]})
    return jsonify(result), 200


# ─── Notes Upload ─────────────────────────────────────────────────────────────

ALLOWED_EXT = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg'}

def _allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


@teacher_bp.route('/notes', methods=['POST'])
@role_required('TEACHER')
def upload_note():
    user = get_current_user()
    title      = request.form.get('title')
    subject_id = request.form.get('subject_id')
    class_id   = request.form.get('class_id')
    description= request.form.get('description', '')
    file       = request.files.get('file')

    if not file or not _allowed(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'notes')
    os.makedirs(save_path, exist_ok=True)
    file.save(os.path.join(save_path, filename))

    note = Note(title=title, description=description,
                file_url=f'/uploads/notes/{filename}', file_name=filename,
                subject_id=subject_id, class_id=class_id,
                school_id=user.school_id, uploaded_by=user.id)
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@teacher_bp.route('/notes', methods=['GET'])
@role_required('TEACHER', 'STUDENT', 'PRINCIPAL')
def list_notes():
    user     = get_current_user()
    class_id = request.args.get('class_id')
    q = Note.query.filter_by(school_id=user.school_id)
    if class_id:
        q = q.filter_by(class_id=class_id)
    return jsonify([n.to_dict() for n in q.all()]), 200


def _grade(marks, max_marks):
    pct = marks / max_marks * 100 if max_marks else 0
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C'
    if pct >= 33: return 'D'
    return 'F'
