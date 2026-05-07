from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.academic import Student, Attendance, Marks
from app.models.financial import FeeRecord
from app.utils.decorators import role_required, get_current_user

student_bp = Blueprint('student', __name__)


@student_bp.route('/profile', methods=['GET'])
@role_required('STUDENT', 'PARENT')
def my_profile():
    user    = get_current_user()
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    return jsonify(student.to_dict()), 200


@student_bp.route('/attendance', methods=['GET'])
@role_required('STUDENT')
def my_attendance():
    user    = get_current_user()
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({'error': 'Not found'}), 404
    records = Attendance.query.filter_by(student_id=student.id).order_by(Attendance.date.desc()).all()
    total   = len(records)
    present = sum(1 for r in records if r.status == 'PRESENT')
    return jsonify({
        'total_days': total, 'present': present, 'absent': total - present,
        'percentage': round(present / total * 100, 1) if total else 0,
        'records': [r.to_dict() for r in records[:30]]  # last 30 days
    }), 200


@student_bp.route('/marks', methods=['GET'])
@role_required('STUDENT')
def my_marks():
    user    = get_current_user()
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({'error': 'Not found'}), 404
    exam_type = request.args.get('exam_type')
    q = Marks.query.filter_by(student_id=student.id)
    if exam_type:
        q = q.filter_by(exam_type=exam_type)
    return jsonify([m.to_dict() for m in q.all()]), 200


@student_bp.route('/fees', methods=['GET'])
@role_required('STUDENT', 'PARENT')
def my_fees():
    user    = get_current_user()
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({'error': 'Not found'}), 404
    records  = FeeRecord.query.filter_by(student_id=student.id).all()
    total_due   = sum(r.amount_due for r in records)
    total_paid  = sum(r.amount_paid for r in records)
    return jsonify({
        'total_due': total_due, 'total_paid': total_paid,
        'balance': total_due - total_paid,
        'records': [r.to_dict() for r in records]
    }), 200
