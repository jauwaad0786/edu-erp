from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.academic import Class, Teacher, Student, Subject, Marks
from app.models.financial import FeeRecord, FeeStructure, ExamSchedule, ExamTimetable
from app.utils.decorators import role_required, get_current_user
from app.utils.pdf_generator import generate_admit_card, generate_result_card
from sqlalchemy import func

principal_bp = Blueprint('principal', __name__)


def _school_id():
    return get_current_user().school_id


# ─── Classes ─────────────────────────────────────────────────────────────────

@principal_bp.route('/classes', methods=['GET'])
@role_required('PRINCIPAL')
def list_classes():
    classes = Class.query.filter_by(school_id=_school_id()).all()
    result = []
    for c in classes:
        d = c.to_dict()
        d['student_count'] = c.students.count()
        result.append(d)
    return jsonify(result), 200


@principal_bp.route('/classes', methods=['POST'])
@role_required('PRINCIPAL')
def create_class():
    data = request.get_json()
    cls = Class(name=data['name'], section=data.get('section', 'A'),
                session=data.get('session', '2024-25'), school_id=_school_id())
    db.session.add(cls)
    db.session.commit()
    return jsonify(cls.to_dict()), 201


# ─── Teachers ────────────────────────────────────────────────────────────────

@principal_bp.route('/teachers', methods=['GET'])
@role_required('PRINCIPAL')
def list_teachers():
    teachers = Teacher.query.filter_by(school_id=_school_id()).all()
    return jsonify([t.to_dict() for t in teachers]), 200


@principal_bp.route('/teachers', methods=['POST'])
@role_required('PRINCIPAL')
def create_teacher():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(name=data['name'], email=data['email'].lower(),
                role=UserRole.TEACHER, school_id=_school_id(), phone=data.get('phone'))
    user.set_password(data.get('password', 'Teacher@123'))
    db.session.add(user)
    db.session.flush()
    teacher = Teacher(user_id=user.id, school_id=_school_id(),
                      employee_id=data.get('employee_id'),
                      department=data.get('department'),
                      designation=data.get('designation', 'Teacher'))
    db.session.add(teacher)
    db.session.commit()
    return jsonify(teacher.to_dict()), 201


@principal_bp.route('/teachers/<int:t_id>/assign', methods=['POST'])
@role_required('PRINCIPAL')
def assign_teacher(t_id):
    """Assign teacher to a subject/class."""
    data = request.get_json()
    subject = Subject.query.get_or_404(data['subject_id'])
    subject.teacher_id = t_id
    db.session.commit()
    return jsonify({'message': 'Teacher assigned'}), 200


# ─── Students ────────────────────────────────────────────────────────────────

@principal_bp.route('/students', methods=['GET'])
@role_required('PRINCIPAL')
def list_students():
    class_id = request.args.get('class_id')
    q = Student.query.filter_by(school_id=_school_id())
    if class_id:
        q = q.filter_by(class_id=class_id)
    return jsonify([s.to_dict() for s in q.all()]), 200


@principal_bp.route('/students', methods=['POST'])
@role_required('PRINCIPAL')
def create_student():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(name=data['name'], email=data['email'].lower(),
                role=UserRole.STUDENT, school_id=_school_id())
    user.set_password(data.get('password', 'Student@123'))
    db.session.add(user)
    db.session.flush()
    student = Student(user_id=user.id, school_id=_school_id(),
                      class_id=data.get('class_id'),
                      roll_number=data.get('roll_number'),
                      admission_no=data.get('admission_no'),
                      parent_name=data.get('parent_name'),
                      parent_phone=data.get('parent_phone'),
                      parent_email=data.get('parent_email'),
                      gender=data.get('gender'),
                      session=data.get('session', '2024-25'))
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


# ─── Fees ─────────────────────────────────────────────────────────────────────

@principal_bp.route('/fees/summary', methods=['GET'])
@role_required('PRINCIPAL')
def fees_summary():
    sid = _school_id()
    total_due  = db.session.query(func.sum(FeeRecord.amount_due)).filter_by(school_id=sid).scalar() or 0
    total_paid = db.session.query(func.sum(FeeRecord.amount_paid)).filter_by(school_id=sid).scalar() or 0
    pending    = db.session.query(func.count(FeeRecord.id)).filter_by(school_id=sid, status='PENDING').scalar() or 0
    overdue    = db.session.query(func.count(FeeRecord.id)).filter_by(school_id=sid, status='OVERDUE').scalar() or 0
    return jsonify({
        'total_due': total_due, 'total_collected': total_paid,
        'pending_count': pending, 'overdue_count': overdue,
        'collection_rate': round(total_paid / total_due * 100, 1) if total_due else 0
    }), 200


@principal_bp.route('/fees/records', methods=['GET'])
@role_required('PRINCIPAL')
def fee_records():
    class_id = request.args.get('class_id')
    status   = request.args.get('status')
    q = FeeRecord.query.filter_by(school_id=_school_id())
    if status:
        q = q.filter_by(status=status)
    records = q.all()
    return jsonify([r.to_dict() for r in records]), 200


@principal_bp.route('/fees/collect', methods=['POST'])
@role_required('PRINCIPAL')
def collect_fee():
    data = request.get_json()
    record = FeeRecord.query.get_or_404(data['record_id'])
    record.amount_paid  = data['amount_paid']
    record.payment_mode = data.get('payment_mode', 'CASH')
    record.status       = 'PAID' if data['amount_paid'] >= record.amount_due else 'PARTIAL'
    from datetime import date
    record.paid_date    = date.today()
    db.session.commit()
    return jsonify(record.to_dict()), 200


# ─── Exams & PDF Generation ───────────────────────────────────────────────────

@principal_bp.route('/exams', methods=['GET'])
@role_required('PRINCIPAL')
def list_exams():
    exams = ExamSchedule.query.filter_by(school_id=_school_id()).all()
    return jsonify([e.to_dict() for e in exams]), 200


@principal_bp.route('/exams', methods=['POST'])
@role_required('PRINCIPAL')
def create_exam():
    data = request.get_json()
    from datetime import date
    exam = ExamSchedule(
        school_id=_school_id(),
        exam_name=data['exam_name'],
        exam_type=data.get('exam_type', 'MID_TERM'),
        session=data.get('session', '2024-25'),
        start_date=date.fromisoformat(data['start_date']),
        end_date=date.fromisoformat(data['end_date']),
        created_by=get_current_user().id
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify(exam.to_dict()), 201


@principal_bp.route('/exams/<int:exam_id>/publish', methods=['POST'])
@role_required('PRINCIPAL')
def publish_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    exam.is_published = True
    db.session.commit()
    return jsonify({'message': 'Exam published', 'exam': exam.to_dict()}), 200


@principal_bp.route('/admit-card/<int:student_id>/<int:exam_id>', methods=['GET'])
@role_required('PRINCIPAL')
def admit_card_pdf(student_id, exam_id):
    student = Student.query.get_or_404(student_id)
    exam    = ExamSchedule.query.get_or_404(exam_id)
    from app.models.school import School
    school  = School.query.get(student.school_id)
    timetable = ExamTimetable.query.filter_by(exam_id=exam_id,
                                              class_id=student.class_id).all()
    buf = generate_admit_card(student, school, exam, timetable)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f'AdmitCard_{student.roll_number}_{exam.exam_name}.pdf')


@principal_bp.route('/result-card/<int:student_id>/<int:exam_id>', methods=['GET'])
@role_required('PRINCIPAL')
def result_card_pdf(student_id, exam_id):
    student = Student.query.get_or_404(student_id)
    exam    = ExamSchedule.query.get_or_404(exam_id)
    from app.models.school import School
    school  = School.query.get(student.school_id)
    marks   = Marks.query.filter_by(student_id=student_id, exam_type=exam.exam_name).all()
    marks_data = []
    for m in marks:
        marks_data.append({
            'subject_name': m.subject.name if m.subject else 'N/A',
            'max_marks': m.max_marks, 'marks_obtained': m.marks_obtained,
            'grade': m.grade
        })
    buf = generate_result_card(student, school, exam, marks_data)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f'ResultCard_{student.roll_number}_{exam.exam_name}.pdf')


# ─── Dashboard stats ─────────────────────────────────────────────────────────

@principal_bp.route('/dashboard', methods=['GET'])
@role_required('PRINCIPAL')
def dashboard():
    sid = _school_id()
    return jsonify({
        'total_students': Student.query.filter_by(school_id=sid).count(),
        'total_teachers': Teacher.query.filter_by(school_id=sid).count(),
        'total_classes':  Class.query.filter_by(school_id=sid).count(),
        'fee_collected':  db.session.query(func.sum(FeeRecord.amount_paid)).filter_by(school_id=sid).scalar() or 0,
        'fee_pending':    db.session.query(func.sum(FeeRecord.amount_due - FeeRecord.amount_paid)).filter_by(school_id=sid).scalar() or 0,
    }), 200
