from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.academic import (
    Class, Teacher, Student, Subject, Marks,
    Attendance, TeacherAttendance, TeacherAttendanceRequest, Note
)
from app.models.financial import FeeRecord, FeeStructure, ExamSchedule, ExamTimetable, Holiday
from app.models.financial import FeeRecord, FeeStructure, ExamSchedule, ExamTimetable
from app.utils.decorators import role_required, get_current_user
from app.utils.pdf_generator import generate_admit_card, generate_result_card
from sqlalchemy import func
from datetime import date, datetime
import random, string
import cloudinary
import cloudinary.uploader
import os
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
        father_name=data.get('father_name'),
        mother_name=data.get('mother_name'),
        school_id=_school_id()
    )
    db.session.add(cls)
    db.session.commit()
    return jsonify(cls.to_dict()), 201

@principal_bp.route('/classes/<int:class_id>/detail', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def class_detail(class_id):
    sid = _school_id()
    cls = Class.query.get_or_404(class_id)
    if cls.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    students = cls.students.all()
    total_students = len(students)

    # ── Fee summary ──
    student_ids = [s.id for s in students]
    total_due  = db.session.query(func.sum(FeeRecord.amount_due))\
                   .filter(FeeRecord.student_id.in_(student_ids)).scalar() or 0 if student_ids else 0
    total_paid = db.session.query(func.sum(FeeRecord.amount_paid))\
                   .filter(FeeRecord.student_id.in_(student_ids)).scalar() or 0 if student_ids else 0

    fee_paid_count    = 0
    fee_pending_count = 0
    for s in students:
        s_due  = db.session.query(func.sum(FeeRecord.amount_due)).filter_by(student_id=s.id).scalar() or 0
        s_paid = db.session.query(func.sum(FeeRecord.amount_paid)).filter_by(student_id=s.id).scalar() or 0
        if s_due > 0 and s_paid >= s_due:
            fee_paid_count += 1
        else:
            fee_pending_count += 1

    # ── Marks / Topper ──
    from collections import defaultdict
    from sqlalchemy import desc

    all_marks = Marks.query.filter(Marks.student_id.in_(student_ids)).all() if student_ids else []

    # Per-student aggregate: total obtained / total max → percentage
    student_marks_map = defaultdict(lambda: {'obtained': 0, 'max': 0})
    for m in all_marks:
        student_marks_map[m.student_id]['obtained'] += m.marks_obtained or 0
        student_marks_map[m.student_id]['max']      += m.max_marks or 0

    # Exam types available
    exam_types = list({m.exam_type for m in all_marks})

    # Overall topper (all exams combined)
    topper = None
    best_pct = -1
    for s in students:
        rec = student_marks_map.get(s.id)
        if rec and rec['max'] > 0:
            pct = round(rec['obtained'] / rec['max'] * 100, 1)
            if pct > best_pct:
                best_pct = pct
                topper = {
                    'student_id': s.id,
                    'name':       s.user.name if s.user else '',
                    'roll_number': s.roll_number or '',
                    'percentage': pct,
                    'obtained':   rec['obtained'],
                    'max':        rec['max'],
                }

    # Subject-wise toppers
    subject_toppers = {}
    subjects = cls.subjects.all()
    for subj in subjects:
        subj_marks = [m for m in all_marks if m.subject_id == subj.id]
        if not subj_marks:
            continue
        top_m = max(subj_marks, key=lambda m: m.marks_obtained or 0)
        student = Student.query.get(top_m.student_id)
        subject_toppers[subj.name] = {
            'student_id':   top_m.student_id,
            'name':         student.user.name if student and student.user else '',
            'marks':        top_m.marks_obtained,
            'max_marks':    top_m.max_marks,
            'percentage':   round(top_m.marks_obtained / top_m.max_marks * 100, 1) if top_m.max_marks else 0,
        }

    # Class avg percentage
    all_pcts = []
    for s in students:
        rec = student_marks_map.get(s.id)
        if rec and rec['max'] > 0:
            all_pcts.append(rec['obtained'] / rec['max'] * 100)
    avg_percentage = round(sum(all_pcts) / len(all_pcts), 1) if all_pcts else 0

    # ── Class Teacher ──
    class_teacher = None
    if cls.teacher_id:
        t = Teacher.query.get(cls.teacher_id)
        if t:
            class_teacher = {
                'teacher_id':  t.id,
                'name':        t.user.name if t.user else '',
                'email':       t.user.email if t.user else '',
                'designation': t.designation or 'Teacher',
                'department':  t.department or '',
                'employee_id': t.employee_id or '',
                'salary':      t.salary or 0,
            }

    # ── Today's attendance ──
    today = date.today()
    att_today = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == today
    ).all() if student_ids else []
    present_today = sum(1 for a in att_today if a.status == 'PRESENT')
    absent_today  = sum(1 for a in att_today if a.status == 'ABSENT')

    return jsonify({
        'class_id':       cls.id,
        'class_name':     cls.name,
        'section':        cls.section,
        'session':        cls.session,
        'total_students': total_students,
        'fees': {
            'total_due':    total_due,
            'total_paid':   total_paid,
            'pending':      total_due - total_paid,
            'paid_count':   fee_paid_count,
            'pending_count':fee_pending_count,
            'collection_pct': round(total_paid / total_due * 100, 1) if total_due else 0,
        },
        'marks': {
            'avg_percentage': avg_percentage,
            'exam_types':     exam_types,
            'topper':         topper,
            'subject_toppers': subject_toppers,
        },
        'attendance_today': {
            'present':    present_today,
            'absent':     absent_today,
            'not_marked': total_students - len(att_today),
        },
        'class_teacher': class_teacher,
    }), 200


@principal_bp.route('/classes/<int:class_id>/assign-teacher', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def assign_class_teacher(class_id):
    """Assign a class teacher to a class."""
    cls = Class.query.get_or_404(class_id)
    data = request.get_json()
    cls.teacher_id = data.get('teacher_id')
    db.session.commit()
    return jsonify({'message': 'Class teacher assigned'}), 200
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
        user_id      = user.id,
        school_id    = _school_id(),
        employee_id  = data.get('employee_id'),
        department   = data.get('department'),
        designation  = data.get('designation', 'Teacher'),
        salary       = float(data['salary']) if data.get('salary') else 0.0,
        joining_date = date.fromisoformat(data['joining_date']) if data.get('joining_date') else None,
        qualification= data.get('qualification', ''),
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

@principal_bp.route('/teachers/<int:teacher_id>/profile', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def teacher_profile(teacher_id):
    sid = _school_id()
    t   = Teacher.query.get_or_404(teacher_id)
    if t.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    user = t.user

    # ── Basic Info ──
    info = {
        'id':           t.id,
        'name':         user.name        if user else '',
        'email':        user.email       if user else '',
        'phone':        user.phone       if user else '',
        'employee_id':  t.employee_id    or '',
        'department':   t.department     or '',
        'designation':  t.designation    or 'Teacher',
        'joining_date': str(t.joining_date) if t.joining_date else '',
        'qualification':t.qualification  or '',
        'salary':       t.salary         or 0,
        'subjects_count': t.classes_taught.count(),
        'photo_url': t.photo_url or '',
    }

    # ── Classes & Subjects taught ──
    subjects      = t.classes_taught.all()
    classes_taught = []
    seen_classes   = set()

    for subj in subjects:
        cls = Class.query.get(subj.class_id)
        if not cls:
            continue
        is_class_teacher = (cls.teacher_id == t.id)
        classes_taught.append({
            'class_id':         cls.id,
            'class_name':       cls.name,
            'section':          cls.section,
            'session':          cls.session,
            'subject_name':     subj.name,
            'subject_id':       subj.id,
            'student_count':    cls.students.count(),
            'is_class_teacher': is_class_teacher,
        })
        seen_classes.add(cls.id)

    # Also check if class teacher of any class not in subjects
    class_teacher_of = Class.query.filter_by(
        school_id=sid, teacher_id=t.id
    ).all()
    for cls in class_teacher_of:
        if cls.id not in seen_classes:
            classes_taught.append({
                'class_id':         cls.id,
                'class_name':       cls.name,
                'section':          cls.section,
                'session':          cls.session,
                'subject_name':     'Class Teacher',
                'subject_id':       None,
                'student_count':    cls.students.count(),
                'is_class_teacher': True,
            })

    # ── Attendance ──
    all_att = TeacherAttendance.query.filter_by(
        teacher_id=teacher_id
    ).all()

    present   = sum(1 for a in all_att if a.status == 'PRESENT')
    absent    = sum(1 for a in all_att if a.status == 'ABSENT')
    half_day  = sum(1 for a in all_att if a.status == 'HALF_DAY')
    on_leave  = sum(1 for a in all_att if a.status == 'ON_LEAVE')
    total_marked = len(all_att)

    # Month-wise breakdown
    from collections import defaultdict
    month_map = defaultdict(lambda: {'present':0,'absent':0,'half_day':0,'on_leave':0})
    for a in all_att:
        key = a.date.strftime('%Y-%m')
        if   a.status == 'PRESENT':  month_map[key]['present']  += 1
        elif a.status == 'ABSENT':   month_map[key]['absent']   += 1
        elif a.status == 'HALF_DAY': month_map[key]['half_day'] += 1
        elif a.status == 'ON_LEAVE': month_map[key]['on_leave'] += 1

    monthly = [
        {
            'month':    k,
            'present':  v['present'],
            'absent':   v['absent'],
            'half_day': v['half_day'],
            'on_leave': v['on_leave'],
        }
        for k, v in sorted(month_map.items(), reverse=True)
    ]

    attendance = {
        'total_marked': total_marked,
        'present':      present,
        'absent':       absent,
        'half_day':     half_day,
        'on_leave':     on_leave,
        'percentage':   round(present / total_marked * 100, 1) if total_marked else 0,
        'monthly':      monthly,
    }

    # ── Salary History ──
    from app.models.financial import SalaryRecord
    sal_records = SalaryRecord.query.filter_by(
        teacher_id=teacher_id
    ).order_by(SalaryRecord.created_at.desc()).all() \
    if hasattr(SalaryRecord, 'query') else []

    salary_history = [
        {
            'month':        s.month,
            'amount':       s.amount,
            'status':       s.status,
            'payment_date': str(s.payment_date) if s.payment_date else None,
            'note':         s.note or '',
        }
        for s in sal_records
    ]

    return jsonify({
        'info':           info,
        'classes_taught': classes_taught,
        'attendance':     attendance,
        'salary_history': salary_history,
    }), 200


@principal_bp.route('/teachers/<int:teacher_id>/salary', methods=['PATCH'])
@role_required('PRINCIPAL')
def update_teacher_salary(teacher_id):
    """Principal manually update kare teacher ki salary."""
    t = Teacher.query.get_or_404(teacher_id)
    if t.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    data       = request.get_json()
    old_salary = t.salary or 0
    new_salary = float(data.get('salary', 0))
    t.salary   = new_salary
    db.session.commit()

    return jsonify({
        'message':    'Salary updated',
        'old_salary': old_salary,
        'new_salary': new_salary,
    }), 200


@principal_bp.route('/teachers/<int:teacher_id>/salary/record', methods=['POST'])
@role_required('PRINCIPAL')
def add_salary_record(teacher_id):
    """
    Manually add a salary payment record.
    Body: { month, amount, status, payment_date, note }
    """
    t = Teacher.query.get_or_404(teacher_id)
    if t.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    from app.models.financial import SalaryRecord
    rec = SalaryRecord(
        teacher_id=teacher_id,
        school_id=_school_id(),
        month=data.get('month'),
        amount=float(data.get('amount', t.salary or 0)),
        status=data.get('status', 'PAID'),
        payment_date=date.fromisoformat(data['payment_date'])
                    if data.get('payment_date') else date.today(),
        note=data.get('note', ''),
        created_by=get_current_user().id,
    )
    db.session.add(rec)
    db.session.commit()

    return jsonify({'message': 'Salary record added', 'id': rec.id}), 201
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
    sid        = _school_id()
    class_id   = request.args.get('class_id')
    status     = request.args.get('status')
    student_id = request.args.get('student_id')
    month      = request.args.get('month')
    fee_type   = request.args.get('fee_type')

    q = FeeRecord.query.filter_by(school_id=sid)

    if status:
        q = q.filter_by(status=status)
    if student_id:
        q = q.filter_by(student_id=student_id)
    if month:
        q = q.filter(FeeRecord.month == month)
    if fee_type:
        q = q.filter(FeeRecord.fee_type == fee_type.upper())

    if class_id:
        q = q.join(Student, FeeRecord.student_id == Student.id)\
             .filter(Student.class_id == class_id)

    records = q.order_by(FeeRecord.created_at.desc()).all()

    result = []
    for r in records:
        d = r.to_dict()
        student = Student.query.get(r.student_id)
        if student:
            cls = Class.query.get(student.class_id)
            d['student_name'] = student.user.name if student.user else ''
            d['father_name']  = student.parent_name or ''
            d['roll_number']  = student.roll_number or ''
            d['class_name']   = f"{cls.name} - {cls.section}" if cls else ''
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
@principal_bp.route('/teachers/attendance/today', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def teacher_attendance_today():
    """
    Today's teacher attendance summary.
    Returns: present/absent counts + absent teacher name list.
    Query param: date (YYYY-MM-DD), default today
    """
    sid        = _school_id()
    date_param = request.args.get('date')
    target     = date.fromisoformat(date_param) if date_param else date.today()

    teachers   = Teacher.query.filter_by(school_id=sid).all()
    total      = len(teachers)

    att_map = {
        a.teacher_id: a
        for a in TeacherAttendance.query.filter_by(
            school_id=sid, date=target
        ).all()
    }

    present    = 0
    absent     = 0
    half_day   = 0
    on_leave   = 0
    not_marked = 0
    absent_list = []

    for t in teachers:
        rec = att_map.get(t.id)
        if not rec:
            not_marked += 1
            continue
        if rec.status == 'PRESENT':
            present += 1
        elif rec.status == 'ABSENT':
            absent += 1
            absent_list.append({
                'teacher_id':  t.id,
                'name':        t.user.name if t.user else '',
                'designation': t.designation or 'Teacher',
                'department':  t.department or '',
            })
        elif rec.status == 'HALF_DAY':
            half_day += 1
        elif rec.status == 'ON_LEAVE':
            on_leave += 1
            absent_list.append({
                'teacher_id':  t.id,
                'name':        t.user.name if t.user else '',
                'designation': t.designation or 'Teacher',
                'department':  t.department or '',
                'on_leave':    True,
            })

    return jsonify({
        'date':        str(target),
        'total':       total,
        'present':     present,
        'absent':      absent,
        'half_day':    half_day,
        'on_leave':    on_leave,
        'not_marked':  not_marked,
        'absent_list': absent_list,
    }), 200


@principal_bp.route('/teachers/attendance/mark', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def mark_teacher_attendance():
    """
    Mark attendance for multiple teachers.
    Body: { date, records: [{teacher_id, status, check_in, check_out, remarks}] }
    """
    data      = request.get_json()
    att_date  = date.fromisoformat(data.get('date', str(date.today())))
    records   = data.get('records', [])
    marker_id = get_current_user().id
    sid       = _school_id()

    for rec in records:
        existing = TeacherAttendance.query.filter_by(
            teacher_id=rec['teacher_id'], date=att_date
        ).first()
        if existing:
            existing.status    = rec.get('status', 'PRESENT')
            existing.check_in  = rec.get('check_in')
            existing.check_out = rec.get('check_out')
            existing.remarks   = rec.get('remarks', '')
            existing.marked_by = marker_id
        else:
            att = TeacherAttendance(
                teacher_id=rec['teacher_id'],
                school_id=sid,
                date=att_date,
                status=rec.get('status', 'PRESENT'),
                check_in=rec.get('check_in'),
                check_out=rec.get('check_out'),
                remarks=rec.get('remarks', ''),
                marked_by=marker_id,
            )
            db.session.add(att)

    db.session.commit()
    return jsonify({'message': f'{len(records)} teacher attendance records saved'}), 200

# ─── Exams & PDF ──────────────────────────────────────────────────────────────

# ─── Exams & PDF ──────────────────────────────────────────────────────────────

@principal_bp.route('/exams', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def list_exams():
    status = request.args.get('status')  # DRAFT / PUBLISHED / ARCHIVED
    q = ExamSchedule.query.filter_by(school_id=_school_id())
    if status:
        q = q.filter_by(status=status)
    exams = q.order_by(ExamSchedule.created_at.desc()).all()
    result = []
    for e in exams:
        d = e.to_dict()
        d['timetable_count'] = e.timetable.count()
        # class list jo is exam mein hain
        class_ids = list({t.class_id for t in e.timetable.all()})
        classes = Class.query.filter(Class.id.in_(class_ids)).all() if class_ids else []
        d['classes'] = [{'id': c.id, 'name': c.name, 'section': c.section} for c in classes]
        result.append(d)
    return jsonify(result), 200


@principal_bp.route('/exams', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def create_exam():
    data = request.get_json()
    exam = ExamSchedule(
        school_id    = _school_id(),
        exam_name    = data['exam_name'],
        exam_type    = data.get('exam_type', 'MID_TERM'),
        session      = data.get('session', '2024-25'),
        start_date   = date.fromisoformat(data['start_date']),
        end_date     = date.fromisoformat(data['end_date']),
        instructions = data.get('instructions', ''),
        status       = 'DRAFT',
        is_published = False,
        created_by   = get_current_user().id
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify(exam.to_dict()), 201


@principal_bp.route('/exams/<int:exam_id>', methods=['PATCH'])
@role_required('PRINCIPAL', 'TEACHER')
def update_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    if exam.status == 'PUBLISHED':
        return jsonify({'error': 'Published exam edit nahi ho sakta. Pehle unpublish karo.'}), 400
    data = request.get_json()
    if data.get('exam_name'):    exam.exam_name    = data['exam_name']
    if data.get('exam_type'):    exam.exam_type    = data['exam_type']
    if data.get('session'):      exam.session      = data['session']
    if data.get('start_date'):   exam.start_date   = date.fromisoformat(data['start_date'])
    if data.get('end_date'):     exam.end_date     = date.fromisoformat(data['end_date'])
    if data.get('instructions') is not None:
                                 exam.instructions = data['instructions']
    db.session.commit()
    return jsonify(exam.to_dict()), 200


@principal_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
@role_required('PRINCIPAL')
def delete_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    if exam.status == 'PUBLISHED':
        return jsonify({'error': 'Published exam delete nahi ho sakta'}), 400
    db.session.delete(exam)
    db.session.commit()
    return jsonify({'message': 'Exam deleted'}), 200


@principal_bp.route('/exams/<int:exam_id>/publish', methods=['POST'])
@role_required('PRINCIPAL')
def publish_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    exam.status       = 'PUBLISHED'
    exam.is_published = True
    exam.published_at = datetime.utcnow()
    exam.published_by = get_current_user().id
    db.session.commit()
    return jsonify({'message': 'Exam published', 'exam': exam.to_dict()}), 200


@principal_bp.route('/exams/<int:exam_id>/unpublish', methods=['POST'])
@role_required('PRINCIPAL')
def unpublish_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    exam.status       = 'DRAFT'
    exam.is_published = False
    exam.published_at = None
    db.session.commit()
    return jsonify({'message': 'Exam unpublished', 'exam': exam.to_dict()}), 200


@principal_bp.route('/exams/<int:exam_id>/archive', methods=['POST'])
@role_required('PRINCIPAL')
def archive_exam(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    exam.status       = 'ARCHIVED'
    exam.is_published = False
    db.session.commit()
    return jsonify({'message': 'Exam archived'}), 200


# ─── Exam Timetable (Subject-wise papers) ─────────────────────────────────────

@principal_bp.route('/exams/<int:exam_id>/timetable', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def get_exam_timetable(exam_id):
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    class_id = request.args.get('class_id')
    q = ExamTimetable.query.filter_by(exam_id=exam_id)
    if class_id:
        q = q.filter_by(class_id=class_id)
    items = q.order_by(ExamTimetable.exam_date.asc()).all()
    return jsonify([i.to_dict() for i in items]), 200


@principal_bp.route('/exams/<int:exam_id>/timetable', methods=['POST'])
@role_required('PRINCIPAL', 'TEACHER')
def add_timetable_item(exam_id):
    """Add subject-wise paper to exam timetable."""
    exam = ExamSchedule.query.get_or_404(exam_id)
    if exam.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    item = ExamTimetable(
        exam_id      = exam_id,
        class_id     = data['class_id'],
        subject_id   = data['subject_id'],
        exam_date    = date.fromisoformat(data['exam_date']),
        start_time   = data.get('start_time', '10:00 AM'),
        end_time     = data.get('end_time',   '01:00 PM'),
        venue        = data.get('venue',      'Main Hall'),
        max_marks    = data.get('max_marks',  100),
        pass_marks   = data.get('pass_marks', 33),
        instructions = data.get('instructions', ''),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@principal_bp.route('/exams/timetable/<int:item_id>', methods=['PATCH'])
@role_required('PRINCIPAL', 'TEACHER')
def update_timetable_item(item_id):
    item = ExamTimetable.query.get_or_404(item_id)
    data = request.get_json()
    if data.get('exam_date'):    item.exam_date    = date.fromisoformat(data['exam_date'])
    if data.get('start_time'):   item.start_time   = data['start_time']
    if data.get('end_time'):     item.end_time     = data['end_time']
    if data.get('venue'):        item.venue        = data['venue']
    if data.get('max_marks'):    item.max_marks    = data['max_marks']
    if data.get('pass_marks'):   item.pass_marks   = data['pass_marks']
    if data.get('instructions') is not None:
                                 item.instructions = data['instructions']
    db.session.commit()
    return jsonify(item.to_dict()), 200


@principal_bp.route('/exams/timetable/<int:item_id>', methods=['DELETE'])
@role_required('PRINCIPAL', 'TEACHER')
def delete_timetable_item(item_id):
    item = ExamTimetable.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ─── Admit Card & Result Card PDF ─────────────────────────────────────────────

@principal_bp.route('/admit-card/<int:student_id>/<int:exam_id>', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def admit_card_pdf(student_id, exam_id):
    student   = Student.query.get_or_404(student_id)
    exam      = ExamSchedule.query.get_or_404(exam_id)
    from app.models.school import School
    school    = School.query.get(student.school_id)
    timetable = ExamTimetable.query.filter_by(
        exam_id=exam_id, class_id=student.class_id
    ).order_by(ExamTimetable.exam_date.asc()).all()
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
        'subject_name':   m.subject.name if m.subject else 'N/A',
        'max_marks':      m.max_marks,
        'marks_obtained': m.marks_obtained,
        'grade':          m.grade
    } for m in marks]
    buf = generate_result_card(student, school, exam, marks_data)
    return send_file(buf, mimetype='application/pdf',
                     download_name=f'ResultCard_{student.roll_number}_{exam.exam_name}.pdf')

@principal_bp.route('/students/<int:student_id>/profile', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def student_profile(student_id):
    """
    Full student profile — basic info + attendance + fees + marks.
    """
    student = Student.query.get_or_404(student_id)
    sid     = _school_id()

    # Security: student must belong to this school
    if student.school_id != sid:
        return jsonify({'error': 'Unauthorized'}), 403

    cls  = Class.query.get(student.class_id) if student.class_id else None
    user = student.user

    # ── Basic Info ──────────────────────────────────────────
    info = {
        'id':           student.id,
        'name':         user.name       if user else '',
        'email':        user.email      if user else '',
        'roll_number':  student.roll_number  or '',
        'admission_no': student.admission_no or '',
        'gender':       student.gender       or '',
        'dob':          str(student.dob)     if student.dob else '',
        'address':      student.address      or '',
        'session':      student.session      or '',
        'parent_name':  student.parent_name  or '',
        'parent_phone': student.parent_phone or '',
        'parent_email': student.parent_email or '',
        'class_name':   f"{cls.name} - {cls.section}" if cls else '',
        'class_id':     student.class_id,
        'father_name':  student.father_name  or '',
        'mother_name':  student.mother_name  or '',
        'photo_url':    student.photo_url    or '',
    }

    # ── Attendance Summary ───────────────────────────────────
    all_att = Attendance.query.filter_by(student_id=student_id).all()
    present  = sum(1 for a in all_att if a.status == 'PRESENT')
    absent   = sum(1 for a in all_att if a.status == 'ABSENT')
    late     = sum(1 for a in all_att if a.status == 'LATE')
    total_marked = len(all_att)

    # Month-wise breakdown
    from collections import defaultdict
    month_map = defaultdict(lambda: {'present': 0, 'absent': 0, 'late': 0})
    for a in all_att:
        key = a.date.strftime('%Y-%m')
        month_map[key][a.status.lower()] += 1

    monthly = [
        {
            'month':   k,
            'present': v['present'],
            'absent':  v['absent'],
            'late':    v['late'],
            'total':   v['present'] + v['absent'] + v['late'],
        }
        for k, v in sorted(month_map.items(), reverse=True)
    ]

    # Recent 30 days calendar dots
    from datetime import timedelta
    today      = date.today()
    last_30    = [today - timedelta(days=i) for i in range(30)]
    att_date_map = {a.date: a.status for a in all_att}
    calendar_30 = [
        {
            'date':   str(d),
            'status': att_date_map.get(d, 'NOT_MARKED'),
            'day':    d.strftime('%a'),
        }
        for d in reversed(last_30)
    ]

    attendance = {
        'total_marked': total_marked,
        'present':      present,
        'absent':       absent,
        'late':         late,
        'percentage':   round(present / total_marked * 100, 1) if total_marked else 0,
        'monthly':      monthly,
        'calendar_30':  calendar_30,
    }

    # ── Fee Records ─────────────────────────────────────────
    fee_records = FeeRecord.query.filter_by(student_id=student_id)\
                                 .order_by(FeeRecord.created_at.desc()).all()
    total_due   = sum(f.amount_due  for f in fee_records)
    total_paid  = sum(f.amount_paid for f in fee_records)
    pending     = total_due - total_paid

    # This month's fees
    this_month  = date.today().strftime('%B %Y')
    month_fees  = [f for f in fee_records if f.month == this_month]
    month_paid  = sum(f.amount_paid for f in month_fees)
    month_due   = sum(f.amount_due  for f in month_fees)

    fees = {
        'total_due':    total_due,
        'total_paid':   total_paid,
        'pending':      pending,
        'this_month':   this_month,
        'month_due':    month_due,
        'month_paid':   month_paid,
        'month_status': 'PAID' if month_paid >= month_due and month_due > 0
                        else 'PARTIAL' if month_paid > 0
                        else 'PENDING',
        'records': [
            {
                'id':           r.id,
                'month':        r.month,
                'fee_type':     r.fee_type,
                'amount_due':   r.amount_due,
                'amount_paid':  r.amount_paid,
                'status':       r.status,
                'due_date':     str(r.due_date)  if r.due_date  else None,
                'paid_date':    str(r.paid_date) if r.paid_date else None,
                'receipt_no':   r.receipt_no,
                'payment_mode': r.payment_mode,
            }
            for r in fee_records
        ],
    }

    # ── Marks / Results ─────────────────────────────────────
    marks_records = Marks.query.filter_by(student_id=student_id).all()

    # Group by exam_type
    exam_map = defaultdict(list)
    for m in marks_records:
        exam_map[m.exam_type].append({
            'subject':         m.subject.name if m.subject else 'N/A',
            'marks_obtained':  m.marks_obtained,
            'max_marks':       m.max_marks,
            'grade':           m.grade,
            'percentage':      round(m.marks_obtained / m.max_marks * 100, 1)
                               if m.max_marks else 0,
        })

    exams = [
        {
            'exam_type': exam,
            'subjects':  subj_list,
            'total_obtained': sum(s['marks_obtained'] for s in subj_list),
            'total_max':      sum(s['max_marks']      for s in subj_list),
            'avg_pct':        round(
                sum(s['percentage'] for s in subj_list) / len(subj_list), 1
            ) if subj_list else 0,
        }
        for exam, subj_list in exam_map.items()
    ]

    return jsonify({
        'info':       info,
        'attendance': attendance,
        'fees':       fees,
        'exams':      exams,
    }), 200

# ─── Holidays ─────────────────────────────────────────────────────────────────

@principal_bp.route('/holidays', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER', 'STUDENT')
def list_holidays():
    sid        = _school_id()
    applies_to = request.args.get('applies_to')  # ALL / STUDENT / TEACHER
    q          = Holiday.query.filter_by(school_id=sid)
    if applies_to and applies_to != 'ALL':
        q = q.filter(Holiday.applies_to.in_([applies_to, 'ALL']))
    holidays = q.order_by(Holiday.date.asc()).all()
    return jsonify([h.to_dict() for h in holidays]), 200


@principal_bp.route('/holidays', methods=['POST'])
@role_required('PRINCIPAL')
def create_holiday():
    data = request.get_json()
    h = Holiday(
        school_id   = _school_id(),
        title       = data['title'],
        date        = date.fromisoformat(data['date']),
        end_date    = date.fromisoformat(data['end_date']) if data.get('end_date') else None,
        holiday_type= data.get('holiday_type', 'HOLIDAY'),
        applies_to  = data.get('applies_to', 'ALL'),
        description = data.get('description', ''),
        created_by  = get_current_user().id,
    )
    db.session.add(h)
    db.session.commit()
    return jsonify(h.to_dict()), 201


@principal_bp.route('/holidays/<int:hid>', methods=['DELETE'])
@role_required('PRINCIPAL')
def delete_holiday(hid):
    h = Holiday.query.get_or_404(hid)
    if h.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(h)
    db.session.commit()
    return jsonify({'message': 'Holiday deleted'}), 200


@principal_bp.route('/holidays/<int:hid>', methods=['PUT'])
@role_required('PRINCIPAL')
def update_holiday(hid):
    h    = Holiday.query.get_or_404(hid)
    if h.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if data.get('title'):        h.title        = data['title']
    if data.get('date'):         h.date         = date.fromisoformat(data['date'])
    if data.get('end_date'):     h.end_date     = date.fromisoformat(data['end_date'])
    if data.get('holiday_type'): h.holiday_type = data['holiday_type']
    if data.get('applies_to'):   h.applies_to   = data['applies_to']
    if data.get('description') is not None: h.description = data['description']
    db.session.commit()
    return jsonify(h.to_dict()), 200


# ─── Teacher Attendance Approval ──────────────────────────────────────────────

@principal_bp.route('/teachers/attendance/requests', methods=['GET'])
@role_required('PRINCIPAL')
def list_attendance_requests():
    """All pending teacher attendance requests."""
    sid      = _school_id()
    approval = request.args.get('approval', 'PENDING')
    reqs     = TeacherAttendanceRequest.query.filter_by(
        school_id=sid, approval=approval
    ).order_by(TeacherAttendanceRequest.date.desc()).all()

    result = []
    for r in reqs:
        d = r.to_dict()
        t = Teacher.query.get(r.teacher_id)
        d['teacher_name']  = t.user.name if t and t.user else ''
        d['employee_id']   = t.employee_id or ''
        d['designation']   = t.designation or 'Teacher'
        result.append(d)
    return jsonify(result), 200


@principal_bp.route('/teachers/attendance/requests/<int:req_id>/approve', methods=['POST'])
@role_required('PRINCIPAL')
def approve_attendance_request(req_id):
    """Approve a teacher attendance request → creates TeacherAttendance record."""
    req = TeacherAttendanceRequest.query.get_or_404(req_id)
    if req.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    req.approval    = 'APPROVED'
    req.reviewed_by = get_current_user().id
    req.reviewed_at = datetime.utcnow()

    # Upsert into TeacherAttendance
    existing = TeacherAttendance.query.filter_by(
        teacher_id=req.teacher_id, date=req.date
    ).first()
    if existing:
        existing.status    = req.status
        existing.check_in  = req.check_in
        existing.check_out = req.check_out
        existing.remarks   = req.remarks
        existing.marked_by = get_current_user().id
    else:
        att = TeacherAttendance(
            teacher_id = req.teacher_id,
            school_id  = req.school_id,
            date       = req.date,
            status     = req.status,
            check_in   = req.check_in,
            check_out  = req.check_out,
            remarks    = req.remarks,
            marked_by  = get_current_user().id,
        )
        db.session.add(att)

    db.session.commit()
    return jsonify({'message': 'Approved', 'request': req.to_dict()}), 200


@principal_bp.route('/teachers/attendance/requests/<int:req_id>/deny', methods=['POST'])
@role_required('PRINCIPAL')
def deny_attendance_request(req_id):
    """Deny a teacher attendance request."""
    req = TeacherAttendanceRequest.query.get_or_404(req_id)
    if req.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    req.approval    = 'DENIED'
    req.reviewed_by = get_current_user().id
    req.reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Denied', 'request': req.to_dict()}), 200
# ─── Dashboard ────────────────────────────────────────────────────────────────

@principal_bp.route('/dashboard', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def dashboard():
    sid    = _school_id()
    today  = date.today()

    # Today's student attendance
    total_students = Student.query.filter_by(school_id=sid).count()
    att_today      = Attendance.query.join(
                         Student, Attendance.student_id == Student.id
                     ).filter(
                         Student.school_id == sid,
                         Attendance.date == today
                     ).all()
    s_present = sum(1 for a in att_today if a.status == 'PRESENT')
    s_absent  = sum(1 for a in att_today if a.status == 'ABSENT')

    # Today's teacher attendance
    total_teachers = Teacher.query.filter_by(school_id=sid).count()
    t_att_today    = TeacherAttendance.query.filter_by(
                         school_id=sid, date=today
                     ).all()
    t_present = sum(1 for a in t_att_today if a.status == 'PRESENT')
    t_absent  = sum(1 for a in t_att_today if a.status == 'ABSENT')

    return jsonify({
        'total_students':    total_students,
        'total_teachers':    total_teachers,
        'total_classes':     Class.query.filter_by(school_id=sid).count(),
        'fee_collected':     db.session.query(func.sum(FeeRecord.amount_paid)).filter_by(school_id=sid).scalar() or 0,
        'fee_pending':       db.session.query(
                                 func.sum(FeeRecord.amount_due - FeeRecord.amount_paid)
                             ).filter_by(school_id=sid).scalar() or 0,
        # attendance today
        'students_present':  s_present,
        'students_absent':   s_absent,
        'students_marked':   len(att_today),
        'teachers_present':  t_present,
        'teachers_absent':   t_absent,
        'teachers_marked':   len(t_att_today),
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

# ─── Teacher Self-Routes (teacher apna attendance submit kare) ────────────────

teacher_bp = Blueprint('teacher_self', __name__)

@teacher_bp.route('/self-attendance', methods=['GET'])
@role_required('TEACHER', 'PRINCIPAL')
def get_self_attendance():
    """Today's self-attendance request for logged-in teacher."""
    user    = get_current_user()
    teacher = Teacher.query.filter_by(user_id=user.id).first()
    if not teacher:
        return jsonify(None), 200
    date_param = request.args.get('date', str(date.today()))
    req = TeacherAttendanceRequest.query.filter_by(
        teacher_id=teacher.id,
        date=date.fromisoformat(date_param)
    ).first()
    return jsonify(req.to_dict() if req else None), 200


@teacher_bp.route('/self-attendance', methods=['POST'])
@role_required('TEACHER', 'PRINCIPAL')
def submit_self_attendance():
    """Teacher submits own attendance request."""
    user    = get_current_user()
    teacher = Teacher.query.filter_by(user_id=user.id).first()
    if not teacher:
        return jsonify({'error': 'Teacher profile nahi mila'}), 404

    data     = request.get_json()
    att_date = date.fromisoformat(data.get('date', str(date.today())))

    existing = TeacherAttendanceRequest.query.filter_by(
        teacher_id=teacher.id, date=att_date
    ).first()

    if existing:
        existing.status    = data.get('status', 'PRESENT')
        existing.check_in  = data.get('check_in', '')
        existing.check_out = data.get('check_out', '')
        existing.remarks   = data.get('remarks', '')
        existing.approval  = 'PENDING'   # re-submit → back to pending
        existing.reviewed_by = None
        existing.reviewed_at = None
    else:
        req = TeacherAttendanceRequest(
            teacher_id = teacher.id,
            school_id  = teacher.school_id,
            date       = att_date,
            status     = data.get('status', 'PRESENT'),
            check_in   = data.get('check_in', ''),
            check_out  = data.get('check_out', ''),
            remarks    = data.get('remarks', ''),
            approval   = 'PENDING',
        )
        db.session.add(req)

    db.session.commit()
    result = TeacherAttendanceRequest.query.filter_by(
        teacher_id=teacher.id, date=att_date
    ).first()
    return jsonify(result.to_dict()), 201

@principal_bp.route('/teachers/<int:t_id>', methods=['PATCH'])
@role_required('PRINCIPAL')
def update_teacher(t_id):
    t    = Teacher.query.get_or_404(t_id)
    if t.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if data.get('department'):   t.department   = data['department']
    if data.get('designation'):  t.designation  = data['designation']
    if data.get('qualification'):t.qualification= data['qualification']
    if data.get('salary'):       t.salary       = float(data['salary'])
    if data.get('joining_date'): t.joining_date = date.fromisoformat(data['joining_date'])
    if t.user:
        if data.get('name'):  t.user.name  = data['name']
        if data.get('phone'): t.user.phone = data['phone']
    db.session.commit()
    return jsonify(t.to_dict()), 200
    Class.query.filter_by(teacher_id=t_id).update({'teacher_id': None})
    Subject.query.filter_by(teacher_id=t_id).update({'teacher_id': None})
    
    # Delete teacher attendance records
    TeacherAttendance.query.filter_by(teacher_id=t_id).delete()
    TeacherAttendanceRequest.query.filter_by(teacher_id=t_id).delete()
    db.session.flush()
    
    user = t.user
    db.session.delete(t)
    db.session.flush()
    
    if user:
        Note.query.filter_by(uploaded_by=user.id).update({'uploaded_by': None})
        db.session.flush()
        db.session.delete(user)
    
    db.session.commit()

@principal_bp.route('/teachers/<int:t_id>', methods=['DELETE'])
@role_required('PRINCIPAL')
def delete_teacher(t_id):
    t = Teacher.query.get_or_404(t_id)
    if t.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403
    # Remove class teacher reference first

    return jsonify({'message': 'Teacher removed'}), 200


@principal_bp.route('/attendance/weekly', methods=['GET'])
@role_required('PRINCIPAL', 'TEACHER')
def attendance_weekly():
    """Last 7 days student + teacher attendance for charts."""
    from datetime import timedelta
    sid   = _school_id()
    today = date.today()
    days  = [today - timedelta(days=i) for i in range(6, -1, -1)]

    total_students = Student.query.filter_by(school_id=sid).count()
    total_teachers = Teacher.query.filter_by(school_id=sid).count()
    classes        = Class.query.filter_by(school_id=sid).all()

    student_weekly = []
    teacher_weekly = []

    for d in days:
        # Students
        att = Attendance.query.join(Student, Attendance.student_id == Student.id)\
                .filter(Student.school_id == sid, Attendance.date == d).all()
        present = sum(1 for a in att if a.status == 'PRESENT')
        absent  = sum(1 for a in att if a.status == 'ABSENT')
        late    = sum(1 for a in att if a.status == 'LATE')
        student_weekly.append({
            'date':    str(d),
            'day':     d.strftime('%a'),
            'total':   total_students,
            'present': present,
            'absent':  absent,
            'late':    late,
        })

        # Teachers
        tatt = TeacherAttendance.query.filter_by(school_id=sid, date=d).all()
        t_present = sum(1 for a in tatt if a.status == 'PRESENT')
        t_absent  = sum(1 for a in tatt if a.status == 'ABSENT')
        teacher_weekly.append({
            'date':    str(d),
            'day':     d.strftime('%a'),
            'total':   total_teachers,
            'present': t_present,
            'absent':  t_absent,
        })

    # Class-wise today
    class_today = []
    for c in classes:
        sids = [s.id for s in c.students.all()]
        att  = Attendance.query.filter(
            Attendance.student_id.in_(sids), Attendance.date == today
        ).all() if sids else []
        class_today.append({
            'class_id':   c.id,
            'class_name': f"{c.name} {c.section}",
            'total':      len(sids),
            'present':    sum(1 for a in att if a.status == 'PRESENT'),
            'absent':     sum(1 for a in att if a.status == 'ABSENT'),
            'late':       sum(1 for a in att if a.status == 'LATE'),
        })

    return jsonify({
        'student_weekly': student_weekly,
        'teacher_weekly': teacher_weekly,
        'class_today':    class_today,
    }), 200


cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
)

@principal_bp.route('/students/<int:student_id>/photo', methods=['POST', 'DELETE'])
@role_required('PRINCIPAL', 'TEACHER')
def student_photo(student_id):
    student = Student.query.get_or_404(student_id)
    if student.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    if request.method == 'DELETE':
        student.photo_url = None
        db.session.commit()
        return jsonify({'message': 'Photo deleted'}), 200

    file = request.files.get('photo')
    if not file:
        return jsonify({'error': 'No file'}), 400
    result = cloudinary.uploader.upload(
        file,
        folder=f'eduerp/students',
        public_id=f'student_{student_id}',
        overwrite=True,
        resource_type='image'
    )
    student.photo_url = result['secure_url']
    db.session.commit()
    return jsonify({'photo_url': student.photo_url}), 200


@principal_bp.route('/teachers/<int:teacher_id>/photo', methods=['POST', 'DELETE'])
@role_required('PRINCIPAL')
def teacher_photo(teacher_id):
    t = Teacher.query.get_or_404(teacher_id)
    if t.school_id != _school_id():
        return jsonify({'error': 'Unauthorized'}), 403

    if request.method == 'DELETE':
        t.photo_url = None
        db.session.commit()
        return jsonify({'message': 'Photo deleted'}), 200

    file = request.files.get('photo')
    if not file:
        return jsonify({'error': 'No file'}), 400
    result = cloudinary.uploader.upload(
        file,
        folder=f'eduerp/teachers',
        public_id=f'teacher_{teacher_id}',
        overwrite=True,
        resource_type='image'
    )
    t.photo_url = result['secure_url']
    db.session.commit()
    return jsonify({'photo_url': t.photo_url}), 200
