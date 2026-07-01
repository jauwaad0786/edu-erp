from app import db
from datetime import date, datetime

# ─── Constants ──────────────────────────────────────────────────────────────
# Frontend dropdown isi list se banega. Naya category add karna ho to bas
# yahan add karo — DB schema change nahi karna padega (plain string column hai).

EXPENSE_CATEGORIES = [
    'TEACHER_SALARY',
    'STAFF_SALARY',
    'ELECTRICITY',
    'WATER',
    'INTERNET',
    'RENT',
    'MAINTENANCE',
    'CLEANING',
    'TRANSPORT_FUEL',
    'BOOKS_LIBRARY',
    'SPORTS_EQUIPMENT',
    'COMPUTER_LAB',
    'SCIENCE_LAB',
    'FURNITURE',
    'PRINTER_STATIONERY',
    'MARKETING',
    'SMS_WHATSAPP',
    'ERP_SUBSCRIPTION',
    'INVENTORY_PURCHASE',   # Inventory page se auto-generate hoga
    'MISCELLANEOUS',
]

PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD']

# source field batata hai expense kahan se aayi — isse hum kabhi bhi
# "sirf manual entries dikhao" ya "sirf inventory se aayi expenses dikhao"
# jaisa filter laga sakte hain, aur double-linking bhi trace kar sakte hain.
EXPENSE_SOURCES = ['MANUAL', 'INVENTORY_AUTO', 'SALARY_AUTO']


class Expense(db.Model):
    """
    Har rupaya jo school kharch karta hai — isi table se Profit & Loss,
    Cash Flow aur Expense Analytics charts feed honge.
    """
    __tablename__ = 'expenses'

    id             = db.Column(db.Integer, primary_key=True)
    school_id      = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False, index=True)

    category       = db.Column(db.String(40), nullable=False)
    title          = db.Column(db.String(200), nullable=False)     # e.g. "July Electricity Bill"
    vendor_name    = db.Column(db.String(150))                     # free text — full Vendor model baad mein

    amount         = db.Column(db.Float, nullable=False)

    invoice_number = db.Column(db.String(80))
    bill_url       = db.Column(db.String(500))                     # Cloudinary — bill/invoice photo

    payment_method = db.Column(db.String(20), default='CASH')
    payment_date   = db.Column(db.Date, default=date.today)
    month          = db.Column(db.String(20), index=True)          # "July 2026" — auto-set from payment_date
    status         = db.Column(db.String(20), default='PAID')      # PAID / PENDING

    source         = db.Column(db.String(20), default='MANUAL', index=True)
    source_ref_id  = db.Column(db.Integer)   # SalaryRecord.id ya InventoryItem.id jisne ye expense banayi (agar auto)

    remarks        = db.Column(db.String(300), default='')
    created_by     = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':             self.id,
            'category':       self.category,
            'title':          self.title,
            'vendor_name':    self.vendor_name or '',
            'amount':         self.amount,
            'invoice_number': self.invoice_number or '',
            'bill_url':       self.bill_url or None,
            'payment_method': self.payment_method,
            'payment_date':   str(self.payment_date) if self.payment_date else None,
            'month':          self.month,
            'status':         self.status,
            'source':         self.source,
            'source_ref_id':  self.source_ref_id,
            'remarks':        self.remarks or '',
            'created_at':     self.created_at.isoformat() if self.created_at else None,
        }
