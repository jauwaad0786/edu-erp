from app import db
from datetime import datetime


class School(db.Model):
    __tablename__ = 'schools'

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(200), nullable=False)
    code        = db.Column(db.String(20), unique=True, nullable=False)  # e.g. SCH001
    address     = db.Column(db.String(500))
    city        = db.Column(db.String(100))
    state       = db.Column(db.String(100))
    pincode     = db.Column(db.String(10))
    phone       = db.Column(db.String(20))
    email       = db.Column(db.String(120))
    logo_url    = db.Column(db.String(255))
    is_active   = db.Column(db.Boolean, default=True)
    type        = db.Column(db.String(30), default='SCHOOL')  # SCHOOL / COLLEGE / HOSPITAL
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    created_by  = db.Column(db.Integer, db.ForeignKey('users.id'))

    # Academic year
    current_session = db.Column(db.String(20), default='2024-25')

    # Relationships
    classes  = db.relationship('Class', backref='school', lazy='dynamic')
    teachers = db.relationship('Teacher', backref='school', lazy='dynamic')
    students = db.relationship('Student', backref='school', lazy='dynamic')

    def to_dict(self):
        return {
            'id':       self.id,
            'name':     self.name,
            'code':     self.code,
            'city':     self.city,
            'state':    self.state,
            'type':     self.type,
            'is_active': self.is_active,
            'current_session': self.current_session
        }
