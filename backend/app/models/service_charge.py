# backend/app/models/service_charge.py  ← NEW FILE

from app import db
from datetime import datetime

class ServiceCharge(db.Model):
    __tablename__ = 'service_charges'

    id          = db.Column(db.Integer, primary_key=True)
    school_id   = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    amount      = db.Column(db.Float, nullable=False)
    label       = db.Column(db.String(200), default='Monthly Service Charge')
    charge_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_paid     = db.Column(db.Boolean, default=False)
    note        = db.Column(db.String(500), default='')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    school = db.relationship('School', backref='service_charges')

    def to_dict(self):
        return {
            'id':          self.id,
            'school_id':   self.school_id,
            'amount':      self.amount,
            'label':       self.label,
            'charge_date': self.charge_date.strftime('%Y-%m-%d'),
            'is_paid':     self.is_paid,
            'note':        self.note,
            'created_at':  self.created_at.isoformat(),
        }
