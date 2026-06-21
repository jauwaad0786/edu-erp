from app import db
from datetime import datetime


class School(db.Model):
    __tablename__ = 'schools'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(200), nullable=False)
    code        = db.Column(db.String(20), unique=True, nullable=False)
    address     = db.Column(db.String(500))
    city        = db.Column(db.String(100))
    state       = db.Column(db.String(100))
    pincode     = db.Column(db.String(10))
    phone       = db.Column(db.String(20))
    email       = db.Column(db.String(120))
    logo_url               = db.Column(db.String(500))   # School logo
    principal_signature_url= db.Column(db.String(500))   # Principal signature image
    director_signature_url = db.Column(db.String(500))   # Director/Chairman signature image
    is_active   = db.Column(db.Boolean, default=True)
    type        = db.Column(db.String(30), default='SCHOOL')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    created_by  = db.Column(db.Integer, db.ForeignKey('users.id'))
    current_session = db.Column(db.String(20), default='2024-25')
    plan             = db.Column(db.String(20), default='BASIC')   # BASIC / PROFESSIONAL / ENTERPRISE
    enabled_features = db.Column(db.Text, default='[]')            # JSON list of feature keys

    def get_features(self):
        import json
        try:
            return json.loads(self.enabled_features or '[]')
        except Exception:
            return []

    def set_features(self, feature_list):
        import json
        self.enabled_features = json.dumps(list(feature_list))

    def has_feature(self, key):
        return key in self.get_features()

    

    # Relationships
    classes  = db.relationship('Class',   backref='school', lazy='dynamic')
    teachers = db.relationship('Teacher', backref='school', lazy='dynamic')
    students = db.relationship('Student', backref='school', lazy='dynamic')

    def to_dict(self):
        return {
            'id':                      self.id,
            'name':                    self.name,
            'code':                    self.code,
            'address':                 self.address  or '',
            'city':                    self.city     or '',
            'state':                   self.state    or '',
            'pincode':                 self.pincode  or '',
            'phone':                   self.phone    or '',
            'email':                   self.email    or '',
            'type':                    self.type,
            'is_active':               self.is_active,
            'current_session':         self.current_session,
            'logo_url':                self.logo_url                or None,
            'principal_signature_url': self.principal_signature_url or None,
            'director_signature_url':  self.director_signature_url  or None,
            'plan':                    self.plan or 'BASIC',
            'enabled_features':        self.get_features(),
        
        }
