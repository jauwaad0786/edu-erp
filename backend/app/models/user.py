from app import db, bcrypt
import enum
from datetime import datetime


class UserRole(str, enum.Enum):
    SUPER_ADMIN = 'SUPER_ADMIN'
    PRINCIPAL   = 'PRINCIPAL'
    TEACHER     = 'TEACHER'
    STUDENT     = 'STUDENT'
    PARENT      = 'PARENT'


class User(db.Model):
    __tablename__ = 'users'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(256), nullable=False)
    role       = db.Column(db.Enum(UserRole), nullable=False)
    is_active  = db.Column(db.Boolean, default=True)
    phone      = db.Column(db.String(20))
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # FK to school (null for SUPER_ADMIN)
    school_id  = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=True)

    # Relationships
    school        = db.relationship('School', foreign_keys=[school_id], backref='members')
    teacher_profile = db.relationship('Teacher', backref='user', uselist=False)
    student_profile = db.relationship('Student', backref='user', uselist=False)

    def set_password(self, plain_text):
        self.password = bcrypt.generate_password_hash(plain_text).decode('utf-8')

    def check_password(self, plain_text):
        return bcrypt.check_password_hash(self.password, plain_text)

    def to_dict(self):
        return {
            'id':        self.id,
            'name':      self.name,
            'email':     self.email,
            'role':      self.role.value,
            'school_id': self.school_id,
            'is_active': self.is_active,
            'phone':     self.phone,
            'created_at': self.created_at.isoformat()
        }
