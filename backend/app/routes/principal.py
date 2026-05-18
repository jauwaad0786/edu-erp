from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.academic import Class, Teacher, Student, Subject, Marks, Attendance
from app.models.financial import FeeRecord, FeeStructure, ExamSchedule, ExamTimetable
from app.utils.decorators import role_required, get_current_user
from app.utils.pdf_generator import generate_admit_card, generate_result_card
from sqlalchemy import func
from datetime import date, datetime
import random, string

principal_bp = Blueprint('principal', __name__)


def _school_id():
    return get_current_user().school_id


def _gen_receipt():
    """Generate unique receipt number like RCP-20240518-AB12"""
    today = date.today().strftime('%Y%m%d')
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"RCP-{today}-{suffix}"


# ─── Classes ──────────────────────────────────────────────────────────────────

@principal_bp.route('/classes', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_classes():
    classes = Class.query.filter_by(school_id=_school_id()).all()
    result = []
    for c in classes:
        d = c.to_dict()
        d['student_count'] = c.students.count()
        result.append(d)
    return jsonify(result), 200


@principal_bp.route('/classes', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_class():
    data = request.get_json()
    cls = Class(
        name=data['name'],
        section=data.get('section', 'A'),
        session=data.get('session', '2024-25'),
        school_id=_school_id()
    )
    db.session.add(cls)
    db.session.commit()
    return jsonify(cls.to_dict()), 201


# ─── Teachers ─────────────────────────────────────────────────────────────────

@principal_bp.route('/teachers', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_teachers():
    teachers = Teacher.query.filter_by(school_id=_school_id()).all()
    return jsonify([t.to_dict() for t in teachers]), 200


@principal_bp.route('/teachers', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_teacher():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(
        name=data['name'], email=data['email'].lower(),
        role=UserRole.TEACHER, school_id=_school_id(),
        phone=data.get('phone')
    )
    user.set_password(data.get('password', 'Teacher@123'))
    db.session.add(user)
    db.session.flush()
    teacher = Teacher(
        user_id=user.id, school_id=_school_id(),
        employee_id=data.get('employee_id'),
        department=data.get('department'),
        designation=data.get('designation', 'Teacher')
    )
    db.session.add(teacher)
    db.session.commit()
    return jsonify(teacher.to_dict()), 201


@principal_bp.route('/teachers/<int:t_id>/assign', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def assign_teacher(t_id):
    data = request.get_json()
    subject = Subject.query.get_or_404(data['subject_id'])
    subject.teacher_id = t_id
    db.session.commit()
    return jsonify({'message': 'Teacher assigned'}), 200


# ─── Students ─────────────────────────────────────────────────────────────────

@principal_bp.route('/students', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_students():
    class_id = request.args.get('class_id')
    q = Student.query.filter_by(school_id=_school_id())
    if class_id:
        q = q.filter_by(class_id=class_id)
    return jsonify([s.to_dict() for s in q.all()]), 200


@principal_bp.route('/students', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_student():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(
        name=data['name'], email=data['email'].lower(),
        role=UserRole.STUDENT, school_id=_school_id()
    )
    user.set_password(data.get('password', 'Student@123'))
    db.session.add(user)
    db.session.flush()
    student = Student(
        user_id=user.id, school_id=_school_id(),
        class_id=data.get('class_id'),
        roll_number=data.get('roll_number'),
        admission_no=data.get('admission_no'),
        parent_name=data.get('parent_name'),
        parent_phone=data.get('parent_phone'),
        parent_email=data.get('parent_email'),
        gender=data.get('gender'),
        dob=date.fromisoformat(data['dob']) if data.get('dob') else None,
        address=data.get('address'),
        session=data.get('session', '2024-25')
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


# ─── Fees ─────────────────────────────────────────────────────────────────────

@principal_bp.route('/fees/summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
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
@role_required('PRINCIPAL', 'TEACHER')
def fee_records():
    """
    Returns fee records with full student info.
    Query params: class_id, status, student_id
    """
    sid      = _school_id()
    class_id = request.args.get('class_id')
    status   = request.args.get('status')
    student_id = request.args.get('student_id')

    q = FeeRecord.query.filter_by(school_id=sid)

    if status:
        q = q.filter_by(status=status)
    if student_id:
        q = q.filter_by(student_id=student_id)

    # Join with Student to filter by class
    if class_id:
        q = q.join(Student, FeeRecord.student_id == Student.id)\
             .filter(Student.class_id == class_id)

    records = q.order_by(FeeRecord.created_at.desc()).all()

    result = []
    for r in records:
        d = r.to_dict()
        # Attach student info
        student = Student.query.get(r.student_id)
        if student:
            cls = Class.query.get(student.class_id)
            d['student_name']  = student.user.name if student.user else ''
            d['father_name']   = student.parent_name or ''
            d['parent_phone']  = student.parent_phone or ''
            d['roll_number']   = student.roll_number or ''
            d['admission_no']  = student.admission_no or ''
            d['class_name']    = f"{cls.name} - {cls.section}" if cls else ''
            d['class_id']      = student.class_id
        result.append(d)

    return jsonify(result), 200


@principal_bp.route('/fees/collect', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def collect_fee():
    """
    Collect fee for a student.
    Body: record_id, amount_paid, payment_mode
    """
    data   = request.get_json()
    record = FeeRecord.query.get_or_404(data['record_id'])

    record.amount_paid  = float(data['amount_paid'])
    record.payment_mode = data.get('payment_mode', 'CASH')
    record.paid_date    = date.today()
    record.collected_by = get_current_user().id
    record.remarks      = data.get('remarks', '')

    # Auto status
    if record.amount_paid >= record.amount_due:
        record.status = 'PAID'
    elif record.amount_paid > 0:
        record.status = 'PARTIAL'

    # Auto receipt number if not already set
    if not record.receipt_no:
        while True:
            rno = _gen_receipt()
            if not FeeRecord.query.filter_by(receipt_no=rno).first():
                record.receipt_no = rno
                break

    db.session.commit()

    # Return full record with student info
    d = record.to_dict()
    student = Student.query.get(record.student_id)
    if student:
        cls = Class.query.get(student.class_id)
        d['student_name'] = student.user.name if student.user else ''
        d['father_name']  = student.parent_name or ''
        d['class_name']   = f"{cls.name} - {cls.section}" if cls else ''
    return jsonify(d), 200

@principal_bp.route('/fees/generate', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def generate_fees():
    """
    Generate monthly fee records for a class.
    Body:
    {
        class_id,
        month,
        fee_type,
        amount,
        due_date
    }
    """

    data = request.get_json()

    class_id = data.get('class_id')
    month    = data.get('month')
    fee_type = data.get('fee_type', 'TUITION')
    amount   = float(data.get('amount', 0))
    due_date = data.get('due_date')

    if not class_id or not month or amount <= 0:
        return jsonify({'error': 'Missing required fields'}), 400

    students = Student.query.filter_by(
        school_id=_school_id(),
        class_id=class_id
    ).all()

    created = 0
    skipped = 0

    for s in students:

        # duplicate prevention
        exists = FeeRecord.query.filter_by(
            student_id=s.id,
            month=month,
            fee_type=fee_type
        ).first()

        if exists:
            skipped += 1
            continue

        rec = FeeRecord(
            school_id=_school_id(),
            student_id=s.id,
            fee_type=fee_type,
            month=month,
            amount_due=amount,
            amount_paid=0,
            status='PENDING',
            due_date=date.fromisoformat(due_date) if due_date else None
        )

        db.session.add(rec)
        created += 1

    db.session.commit()

    return jsonify({
        'message': f'{created} fee records generated',
        'created': created,
        'skipped': skipped
    }), 201



@principal_bp.route('/fees/class-summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def fees_class_summary():
    """
    Per-class fee summary for dashboard.
    Returns: class name, total_due, total_paid, pending, student list
    """
    sid     = _school_id()
    classes = Class.query.filter_by(school_id=sid).all()
    result  = []

    for c in classes:
        student_ids = [s.id for s in c.students.all()]
        if not student_ids:
            result.append({
                'class_id': c.id, 'class_name': c.name,
                'section': c.section, 'student_count': 0,
                'total_due': 0, 'total_collected': 0,
                'pending': 0, 'collection_pct': 0,
                'students': []
            })
            continue

        total_due  = db.session.query(func.sum(FeeRecord.amount_due))\
                       .filter(FeeRecord.student_id.in_(student_ids)).scalar() or 0
        total_paid = db.session.query(func.sum(FeeRecord.amount_paid))\
                       .filter(FeeRecord.student_id.in_(student_ids)).scalar() or 0

        # Per-student summary for click-through
        students_data = []
        for s in c.students.all():
            s_due  = db.session.query(func.sum(FeeRecord.amount_due))\
                       .filter_by(student_id=s.id).scalar() or 0
            s_paid = db.session.query(func.sum(FeeRecord.amount_paid))\
                       .filter_by(student_id=s.id).scalar() or 0
            students_data.append({
                'student_id':   s.id,
                'student_name': s.user.name if s.user else '',
                'father_name':  s.parent_name or '',
                'roll_number':  s.roll_number or '',
                'total_due':    s_due,
                'total_paid':   s_paid,
                'balance':      s_due - s_paid,
                'status':       'PAID' if s_paid >= s_due and s_due > 0
                                else 'PARTIAL' if s_paid > 0
                                else 'PENDING'
            })

        result.append({
            'class_id':       c.id,
            'class_name':     c.name,
            'section':        c.section,
            'student_count':  len(student_ids),
            'total_due':      total_due,
            'total_collected': total_paid,
            'pending':        total_due - total_paid,
            'collection_pct': round(total_paid / total_due * 100, 1) if total_due else 0,
            'students':       students_data
        })

    return jsonify(result), 200


# ─── Attendance ───────────────────────────────────────────────────────────────

@principal_bp.route('/attendance/summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def attendance_summary():
    """
    School-wide attendance summary.
    Query params: date (YYYY-MM-DD), month (YYYY-MM)
    """
    sid        = _school_id()
    date_param = request.args.get('date')
    month_param= request.args.get('month')  # e.g. "2024-04"

    # All students in this school
    total_students = Student.query.filter_by(school_id=sid).count()

    q = Attendance.query.join(Student, Attendance.student_id == Student.id)\
                        .filter(Student.school_id == sid)

    if date_param:
        target = date.fromisoformat(date_param)
        q = q.filter(Attendance.date == target)
    elif month_param:
        year, month = map(int, month_param.split('-'))
        from sqlalchemy import extract
        q = q.filter(
            extract('year',  Attendance.date) == year,
            extract('month', Attendance.date) == month
        )
    else:
        # Default: today
        target = date.today()
        q = q.filter(Attendance.date == target)

    records   = q.all()
    present   = sum(1 for r in records if r.status == 'PRESENT')
    absent    = sum(1 for r in records if r.status == 'ABSENT')
    late      = sum(1 for r in records if r.status == 'LATE')
    marked    = len(records)

    return jsonify({
        'total_students': total_students,
        'marked':         marked,
        'present':        present,
        'absent':         absent,
        'late':           late,
        'not_marked':     total_students - marked,
        'present_pct':    round(present / total_students * 100, 1) if total_students else 0,
    }), 200


@principal_bp.route('/attendance/class-summary', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def attendance_class_summary():
    """
    Class-wise attendance breakdown.
    Query params: date (YYYY-MM-DD)  [default: today]
    """
    sid        = _school_id()
    date_param = request.args.get('date')
    target     = date.fromisoformat(date_param) if date_param else date.today()

    classes = Class.query.filter_by(school_id=sid).all()
    result  = []

    for c in classes:
        students    = c.students.all()
        total       = len(students)
        student_ids = [s.id for s in students]

        att = Attendance.query.filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date == target
        ).all()

        present  = sum(1 for a in att if a.status == 'PRESENT')
        absent   = sum(1 for a in att if a.status == 'ABSENT')
        late     = sum(1 for a in att if a.status == 'LATE')
        marked   = len(att)

        # Student-wise detail
        att_map = {a.student_id: a.status for a in att}
        students_detail = []
        for s in students:
            students_detail.append({
                'student_id':   s.id,
                'student_name': s.user.name if s.user else '',
                'roll_number':  s.roll_number or '',
                'status':       att_map.get(s.id, 'NOT_MARKED')
            })

        result.append({
            'class_id':    c.id,
            'class_name':  c.name,
            'section':     c.section,
            'total':       total,
            'present':     present,
            'absent':      absent,
            'late':        late,
            'not_marked':  total - marked,
            'present_pct': round(present / total * 100, 1) if total else 0,
            'students':    students_detail
        })

    return jsonify(result), 200


@principal_bp.route('/attendance/mark', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def mark_attendance():
    """
    Mark attendance for multiple students.
    Body: { class_id, date, records: [{student_id, status}] }
    """
    data      = request.get_json()
    class_id  = data.get('class_id')
    att_date  = date.fromisoformat(data.get('date', str(date.today())))
    records   = data.get('records', [])
    marker_id = get_current_user().id

    for rec in records:
        existing = Attendance.query.filter_by(
            student_id=rec['student_id'], date=att_date
        ).first()
        if existing:
            existing.status    = rec['status']
            existing.marked_by = marker_id
        else:
            att = Attendance(
                student_id=rec['student_id'],
                class_id=class_id,
                date=att_date,
                status=rec['status'],
                marked_by=marker_id,
                remarks=rec.get('remarks', '')
            )
            db.session.add(att)

    db.session.commit()
    return jsonify({'message': f'{len(records)} attendance records saved'}), 200


# ─── Exams & PDF ──────────────────────────────────────────────────────────────

@principal_bp.route('/exams', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_exams():
    exams = ExamSchedule.query.filter_by(school_id=_school_id()).all()
    return jsonify([e.to_dict() for e in exams]), 200


@principal_bp.route('/exams', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_exam():
    data = request.get_json()
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
@role_required('PRINCIPAL', 'TEACHER')
def publish_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    exam.is_published = True
    db.session.commit()
    return jsonify({'message': 'Exam published', 'exam': exam.to_dict()}), 200


@principal_bp.route('/admit-card/<int:student_id>/<int:exam_id>', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def admit_card_pdf(student_id, exam_id):
    student   = Student.query.get_or_404(student_id)
    exam      = ExamSchedule.query.get_or_404(exam_id)
    from app.models.school import School
    school    = School.query.get(student.school_id)
    timetable = ExamTimetable.query.filter_by(exam_id=exam_id,
                                              class_id=student.class_id).all()
    buf = generate_admit_card(student, school, exam, timetable)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f'AdmitCard_{student.roll_number}_{exam.exam_name}.pdf')


@principal_bp.route('/result-card/<int:student_id>/<int:exam_id>', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def result_card_pdf(student_id, exam_id):
    student = Student.query.get_or_404(student_id)
    exam    = ExamSchedule.query.get_or_404(exam_id)
    from app.models.school import School
    school  = School.query.get(student.school_id)
    marks   = Marks.query.filter_by(student_id=student_id, exam_type=exam.exam_name).all()
    marks_data = [{
        'subject_name':    m.subject.name if m.subject else 'N/A',
        'max_marks':       m.max_marks,
        'marks_obtained':  m.marks_obtained,
        'grade':           m.grade
    } for m in marks]
    buf = generate_result_card(student, school, exam, marks_data)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f'ResultCard_{student.roll_number}_{exam.exam_name}.pdf')


# ─── Dashboard ────────────────────────────────────────────────────────────────

@principal_bp.route('/dashboard', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def dashboard():
    sid = _school_id()
    return jsonify({
        'total_students': Student.query.filter_by(school_id=sid).count(),
        'total_teachers': Teacher.query.filter_by(school_id=sid).count(),
        'total_classes':  Class.query.filter_by(school_id=sid).count(),
        'fee_collected':  db.session.query(func.sum(FeeRecord.amount_paid)).filter_by(school_id=sid).scalar() or 0,
        'fee_pending':    db.session.query(
                            func.sum(FeeRecord.amount_due - FeeRecord.amount_paid)
                          ).filter_by(school_id=sid).scalar() or 0,
    }), 200


@principal_bp.route('/admission-card/<int:student_id>', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def admission_card_pdf(student_id):
    student = Student.query.get_or_404(student_id)
    from app.models.school import School
    school  = School.query.get(student.school_id)
    from app.utils.pdf_generator import generate_admission_card
    buf = generate_admission_card(student, school)
    return send_file(
        buf,
        mimetype='application/pdf',
        download_name=f'AdmissionCard_{student.admission_no or student_id}.pdf'
    )
