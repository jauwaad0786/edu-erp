from app import db
from datetime import datetime


class Class(db.Model):
    __tablename__ = 'classes'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(50), nullable=False)   # e.g. "Class 10"
    section    = db.Column(db.String(10))                   # e.g. "A"
    session    = db.Column(db.String(20), default='2024-25')
    school_id  = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=True)  # class teacher

    students  = db.relationship('Student', backref='class_ref', lazy='dynamic')
    subjects  = db.relationship('Subject', backref='class_ref', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'section': self.section, 'session': self.session,
            'school_id': self.school_id,
            'teacher_id': self.teacher_id,
        }


class Subject(db.Model):
    __tablename__ = 'subjects'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    code       = db.Column(db.String(20))
    class_id   = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=True)
    max_marks  = db.Column(db.Integer, default=100)
    pass_marks = db.Column(db.Integer, default=33)

    marks      = db.relationship('Marks', backref='subject', lazy='dynamic')
    notes      = db.relationship('Note', backref='subject', lazy='dynamic')

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'code': self.code,
                'class_id': self.class_id, 'max_marks': self.max_marks}


class Teacher(db.Model):
    __tablename__ = 'teachers'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    school_id    = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    employee_id  = db.Column(db.String(30), unique=True)
    department   = db.Column(db.String(100))
    designation  = db.Column(db.String(100), default='Teacher')
    joining_date = db.Column(db.Date)
    qualification= db.Column(db.String(200))
    salary       = db.Column(db.Float, default=0.0)

    classes_taught = db.relationship('Subject', backref='teacher_ref', lazy='dynamic',
                                     foreign_keys='Subject.teacher_id')

    def to_dict(self):
        return {
            'id': self.id, 'employee_id': self.employee_id,
            'department': self.department, 'designation': self.designation,
            'school_id': self.school_id,
            'name': self.user.name if self.user else '',
            'email': self.user.email if self.user else ''
        }


class Student(db.Model):
    __tablename__ = 'students'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    school_id    = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    class_id     = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    roll_number  = db.Column(db.String(20))
    admission_no = db.Column(db.String(30), unique=True)
    dob          = db.Column(db.Date)
    gender       = db.Column(db.String(10))
    address      = db.Column(db.String(500))
    parent_name  = db.Column(db.String(120))
    parent_phone = db.Column(db.String(20))
    parent_email = db.Column(db.String(120))
    blood_group  = db.Column(db.String(5))
    session      = db.Column(db.String(20), default='2024-25')

    attendance = db.relationship('Attendance', backref='student', lazy='dynamic')
    marks      = db.relationship('Marks', backref='student', lazy='dynamic')
    fees       = db.relationship('FeeRecord', backref='student', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'roll_number': self.roll_number,
            'admission_no': self.admission_no, 'class_id': self.class_id,
            'school_id': self.school_id, 'session': self.session,
            'name': self.user.name if self.user else '',
            'email': self.user.email if self.user else '',
            'parent_name': self.parent_name, 'parent_phone': self.parent_phone
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id         = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    class_id   = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    date       = db.Column(db.Date, nullable=False)
    status     = db.Column(db.String(10), default='PRESENT')  # PRESENT / ABSENT / LATE
    marked_by  = db.Column(db.Integer, db.ForeignKey('users.id'))
    remarks    = db.Column(db.String(200))

    __table_args__ = (db.UniqueConstraint('student_id', 'date', name='uq_attendance'),)

    def to_dict(self):
        return {'id': self.id, 'student_id': self.student_id,
                'date': str(self.date), 'status': self.status}


class Marks(db.Model):
    __tablename__ = 'marks'

    id         = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    exam_type  = db.Column(db.String(50))   # e.g. "Mid Term", "Final"
    marks_obtained = db.Column(db.Float, default=0)
    max_marks  = db.Column(db.Float, default=100)
    grade      = db.Column(db.String(5))
    remarks    = db.Column(db.String(200))
    entered_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'subject_id': self.subject_id, 'exam_type': self.exam_type,
            'marks_obtained': self.marks_obtained, 'max_marks': self.max_marks,
            'grade': self.grade
        }


class Note(db.Model):
    __tablename__ = 'notes'

    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), nullable=False)
    description= db.Column(db.Text)
    file_url   = db.Column(db.String(500))
    file_name  = db.Column(db.String(200))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=True)
    class_id   = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    school_id  = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    uploaded_by= db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_at= db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'file_url': self.file_url, 'file_name': self.file_name,
            'subject_id': self.subject_id, 'uploaded_at': self.uploaded_at.isoformat()
        }
class TeacherAttendance(db.Model):
    """Daily attendance record for teachers/staff."""
    __tablename__ = 'teacher_attendance'

    id          = db.Column(db.Integer, primary_key=True)
    teacher_id  = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    school_id   = db.Column(db.Integer, db.ForeignKey('schools.id'),  nullable=False)
    date        = db.Column(db.Date, nullable=False)
    status      = db.Column(db.String(20), default='PRESENT')
    # PRESENT / ABSENT / HALF_DAY / ON_LEAVE
    check_in    = db.Column(db.String(10))   # "09:30 AM"
    check_out   = db.Column(db.String(10))   # "05:00 PM"
    marked_by   = db.Column(db.Integer, db.ForeignKey('users.id'))
    remarks     = db.Column(db.String(200))

    teacher = db.relationship('Teacher', backref='attendance_records')

    __table_args__ = (
        db.UniqueConstraint('teacher_id', 'date', name='uq_teacher_attendance'),
    )

    def to_dict(self):
        return {
            'id':         self.id,
            'teacher_id': self.teacher_id,
            'date':       str(self.date),
            'status':     self.status,
            'check_in':   self.check_in,
            'check_out':  self.check_out,
            'remarks':    self.remarks,
        }
