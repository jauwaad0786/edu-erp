from app import db
from datetime import datetime


class FeeStructure(db.Model):
    """Defines fee structure per class per school."""
    __tablename__ = 'fee_structures'

    id           = db.Column(db.Integer, primary_key=True)
    school_id    = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    class_id     = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    session      = db.Column(db.String(20), default='2024-25')
    fee_type     = db.Column(db.String(50))   # TUITION, EXAM, SPORTS, TRANSPORT
    amount       = db.Column(db.Float, nullable=False)
    frequency    = db.Column(db.String(20), default='MONTHLY')  # MONTHLY / QUARTERLY / ANNUAL
    due_date_day = db.Column(db.Integer, default=10)  # day of month

    def to_dict(self):
        return {
            'id': self.id, 'class_id': self.class_id,
            'fee_type': self.fee_type, 'amount': self.amount,
            'frequency': self.frequency
        }


class FeeRecord(db.Model):
    """Individual student fee payment record."""
    __tablename__ = 'fee_records'

    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    school_id    = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    fee_type     = db.Column(db.String(50))
    amount_due   = db.Column(db.Float, nullable=False)
    amount_paid  = db.Column(db.Float, default=0.0)
    discount     = db.Column(db.Float, default=0.0)
    fine         = db.Column(db.Float, default=0.0)
    status       = db.Column(db.String(20), default='PENDING')  # PENDING / PAID / PARTIAL / OVERDUE
    month        = db.Column(db.String(20))   # e.g. "April 2024"
    due_date     = db.Column(db.Date)
    paid_date    = db.Column(db.Date)
    receipt_no   = db.Column(db.String(50), unique=True)
    payment_mode = db.Column(db.String(30))   # CASH / ONLINE / CHEQUE
    collected_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    session      = db.Column(db.String(20), default='2024-25')
    remarks      = db.Column(db.String(300))
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'fee_type': self.fee_type, 'amount_due': self.amount_due,
            'amount_paid': self.amount_paid, 'status': self.status,
            'month': self.month, 'due_date': str(self.due_date) if self.due_date else None,
            'paid_date': str(self.paid_date) if self.paid_date else None,
            'receipt_no': self.receipt_no, 'payment_mode': self.payment_mode
        }


class ExamSchedule(db.Model):
    """Exam schedule — triggers admit card generation."""
    __tablename__ = 'exam_schedules'

    id         = db.Column(db.Integer, primary_key=True)
    school_id  = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    exam_name  = db.Column(db.String(100), nullable=False)   # e.g. "Half Yearly 2024"
    exam_type  = db.Column(db.String(50))                    # MID_TERM / FINAL / UNIT_TEST
    session    = db.Column(db.String(20), default='2024-25')
    start_date = db.Column(db.Date)
    end_date   = db.Column(db.Date)
    is_published = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    timetable  = db.relationship('ExamTimetable', backref='exam', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'exam_name': self.exam_name,
            'exam_type': self.exam_type, 'session': self.session,
            'start_date': str(self.start_date), 'end_date': str(self.end_date),
            'is_published': self.is_published
        }


class ExamTimetable(db.Model):
    """Subject-wise exam schedule."""
    __tablename__ = 'exam_timetable'

    id           = db.Column(db.Integer, primary_key=True)
    exam_id      = db.Column(db.Integer, db.ForeignKey('exam_schedules.id'), nullable=False)
    class_id     = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    subject_id   = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    exam_date    = db.Column(db.Date, nullable=False)
    start_time   = db.Column(db.String(10))  # "10:00 AM"
    end_time     = db.Column(db.String(10))  # "01:00 PM"
    venue        = db.Column(db.String(100))
    max_marks    = db.Column(db.Integer, default=100)

    def to_dict(self):
        return {
            'id': self.id, 'subject_id': self.subject_id,
            'exam_date': str(self.exam_date), 'start_time': self.start_time,
            'end_time': self.end_time, 'venue': self.venue
        }
