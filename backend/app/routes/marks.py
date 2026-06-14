from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models.academic import Class, Subject, Student, Marks
from app.models.financial import ExamSchedule, ExamTimetable
from app.utils.decorators import role_required, get_current_user

marks_bp = Blueprint('marks', __name__)


def _school_id():
    return get_current_user().school_id


def _grade(marks, max_marks):
    pct = marks / max_marks * 100 if max_marks else 0
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C'
    if pct >= 33: return 'D'
    return 'F'


# ─── Marks Entry ────────────────────────────────────────────────────────────

@marks_bp.route('/roster', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def get_marks_roster():
    """
    Fetch the student list for a Class + Exam + Subject, with any marks
    already entered, so the frontend entry grid can pre-fill values.
    Query params: class_id, exam_id, subject_id
    """
    sid = _school_id()
    class_id   = request.args.get('class_id', type=int)
    exam_id    = request.args.get('exam_id', type=int)
    subject_id = request.args.get('subject_id', type=int)

    if not all([class_id, exam_id, subject_id]):
        return jsonify({'error': 'class_id, exam_id and subject_id are required'}), 400

    cls = Class.query.get_or_404(class_id)
    if cls.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    subject = Subject.query.get_or_404(subject_id)
    if subject.school_id and subject.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    # Prefer max/pass marks defined in the exam timetable for this subject; fall back to Subject defaults
    tt = ExamTimetable.query.filter_by(
        exam_id=exam_id, class_id=class_id, subject_id=subject_id
    ).first()
    max_marks  = tt.max_marks  if tt else (subject.max_marks  or 100)
    pass_marks = tt.pass_marks if tt else (subject.pass_marks or 33)

    students = Student.query.filter_by(
        class_id=class_id, school_id=sid
    ).order_by(Student.roll_number).all()

    existing = {
        m.student_id: m for m in Marks.query.filter_by(
            exam_id=exam_id, subject_id=subject_id, class_id=class_id
        ).all()
    }

    roster = []
    for s in students:
        m = existing.get(s.id)
        roster.append({
            'student_id':     s.id,
            'name':           s.user.name if s.user else '',
            'roll_number':    s.roll_number or '',
            'marks_obtained': m.marks_obtained if m else None,
            'is_absent':      m.is_absent if m else False,
            'remarks':        m.remarks if m else '',
            'grade':          m.grade if m else None,
        })

    return jsonify({
        'class':      cls.to_dict(),
        'exam':       exam.to_dict(),
        'subject':    subject.to_dict(),
        'max_marks':  max_marks,
        'pass_marks': pass_marks,
        'students':   roster,
    }), 200


@marks_bp.route('/save', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def save_marks():
    """
    Bulk save/update marks for Class + Exam + Subject.
    Body: {
      class_id, exam_id, subject_id,
      entries: [{student_id, marks_obtained, is_absent, remarks}, ...]
    }
    """
    sid  = _school_id()
    data = request.get_json() or {}

    class_id   = data.get('class_id')
    exam_id    = data.get('exam_id')
    subject_id = data.get('subject_id')
    entries    = data.get('entries', [])

    if not all([class_id, exam_id, subject_id]):
        return jsonify({'error': 'class_id, exam_id and subject_id are required'}), 400

    cls = Class.query.get_or_404(class_id)
    if cls.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    subject = Subject.query.get_or_404(subject_id)

    tt = ExamTimetable.query.filter_by(
        exam_id=exam_id, class_id=class_id, subject_id=subject_id
    ).first()
    default_max = tt.max_marks if tt else (subject.max_marks or 100)

    user  = get_current_user()
    saved = 0

    for e in entries:
        student = Student.query.get(e.get('student_id'))
        # Skip any row that doesn't belong to this school/class (defense against tampered payloads)
        if not student or student.school_id != sid or student.class_id != class_id:
            continue

        is_absent      = bool(e.get('is_absent'))
        marks_obtained = 0 if is_absent else float(e.get('marks_obtained') or 0)
        max_marks       = float(e.get('max_marks') or default_max)

        # clamp to valid range
        marks_obtained = max(0, min(marks_obtained, max_marks))

        record = Marks.query.filter_by(
            student_id=student.id, subject_id=subject_id, exam_id=exam_id
        ).first()
        if not record:
            record = Marks(
                student_id=student.id, subject_id=subject_id, exam_id=exam_id,
                class_id=class_id, school_id=sid,
            )
            db.session.add(record)

        record.marks_obtained = marks_obtained
        record.max_marks      = max_marks
        record.is_absent      = is_absent
        record.remarks        = e.get('remarks', '')
        record.grade          = 'AB' if is_absent else _grade(marks_obtained, max_marks)
        record.entered_by     = user.id
        record.exam_type       = exam.exam_name   # keep in sync for legacy result-card matching

        saved += 1

    db.session.commit()
    return jsonify({'message': f'Marks saved for {saved} students'}), 200


# ─── Topper Analytics ───────────────────────────────────────────────────────

def _rank_toppers(rows, limit=3):
    """rows: list of (student_id, total_obtained, total_max) -> ranked topper dicts."""
    ranked = []
    for student_id, total_obtained, total_max in rows:
        if not total_max:
            continue
        pct = round(total_obtained / total_max * 100, 2)
        ranked.append((student_id, total_obtained or 0, total_max, pct))

    # Highest percentage first; tie-break by raw total marks
    ranked.sort(key=lambda r: (-r[3], -r[1]))

    result = []
    for rank, (student_id, total_obtained, total_max, pct) in enumerate(ranked[:limit], start=1):
        student = Student.query.get(student_id)
        if not student:
            continue
        result.append({
            'rank':           rank,
            'student_id':     student.id,
            'name':           student.user.name if student.user else '',
            'roll_number':    student.roll_number or '',
            'class_id':       student.class_id,
            'class_name':     f"{student.class_ref.name} - {student.class_ref.section}" if student.class_ref else '',
            'photo_url':      student.photo_url,
            'total_obtained': total_obtained,
            'total_max':      total_max,
            'percentage':     pct,
            'grade':          _grade(total_obtained, total_max),
        })
    return result


@marks_bp.route('/toppers/school', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT')
def school_toppers():
    """Top 3 students across the entire school for a given exam."""
    sid     = _school_id()
    exam_id = request.args.get('exam_id', type=int)
    if not exam_id:
        return jsonify({'error': 'exam_id is required'}), 400

    rows = db.session.query(
        Marks.student_id,
        func.sum(Marks.marks_obtained),
        func.sum(Marks.max_marks),
    ).filter(
        Marks.exam_id == exam_id, Marks.school_id == sid, Marks.is_absent == False
    ).group_by(Marks.student_id).all()

    return jsonify(_rank_toppers(rows)), 200


@marks_bp.route('/toppers/class', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT')
def class_toppers():
    """Top 3 students in a specific class for a given exam."""
    sid      = _school_id()
    exam_id  = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    if not exam_id or not class_id:
        return jsonify({'error': 'exam_id and class_id are required'}), 400

    cls = Class.query.get_or_404(class_id)
    if cls.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    rows = db.session.query(
        Marks.student_id,
        func.sum(Marks.marks_obtained),
        func.sum(Marks.max_marks),
    ).filter(
        Marks.exam_id == exam_id, Marks.class_id == class_id, Marks.is_absent == False
    ).group_by(Marks.student_id).all()

    return jsonify(_rank_toppers(rows)), 200


@marks_bp.route('/toppers/subject', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT')
def subject_toppers():
    """Top 3 students for a subject in a given exam (optionally within one class)."""
    sid        = _school_id()
    exam_id    = request.args.get('exam_id', type=int)
    subject_id = request.args.get('subject_id', type=int)
    class_id   = request.args.get('class_id', type=int)  # optional

    if not exam_id or not subject_id:
        return jsonify({'error': 'exam_id and subject_id are required'}), 400

    q = Marks.query.filter_by(
        exam_id=exam_id, subject_id=subject_id, school_id=sid, is_absent=False
    )
    if class_id:
        q = q.filter_by(class_id=class_id)

    top = q.order_by(Marks.marks_obtained.desc()).limit(3).all()

    result = []
    for rank, m in enumerate(top, start=1):
        student = m.student
        if not student:
            continue
        result.append({
            'rank':           rank,
            'student_id':     student.id,
            'name':           student.user.name if student.user else '',
            'roll_number':    student.roll_number or '',
            'class_id':       student.class_id,
            'class_name':     f"{student.class_ref.name} - {student.class_ref.section}" if student.class_ref else '',
            'photo_url':      student.photo_url,
            'marks_obtained': m.marks_obtained,
            'max_marks':      m.max_marks,
            'percentage':     round(m.marks_obtained / m.max_marks * 100, 2) if m.max_marks else 0,
            'grade':          m.grade,
            'subject_name':   m.subject.name if m.subject else '',
        })
    return jsonify(result), 200
