"""
EduERP — Student ID Card PDF Generator
Blue enterprise theme. Front page + Back page in one PDF.
Uses only ReportLab (already in requirements) + qrcode + PIL.
"""
import io
import os
import json
import base64
import urllib.request
from datetime import datetime

import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# ── Card dimensions (CR80 standard, portrait) ────────────────────────────────
CARD_W  = 85.6 * mm   # ~242 pt
CARD_H  = 54.0 * mm   # ~153 pt — standard ID card
# We render portrait so swap:
CW      = 54.0 * mm   # width  in portrait
CH      = 85.6 * mm   # height in portrait

# Colours — blue enterprise theme
NAVY    = colors.HexColor('#032d60')
BLUE    = colors.HexColor('#0176d3')
LBLUE   = colors.HexColor('#e8f4fd')
ACCENT  = colors.HexColor('#f0a500')   # gold stripe
WHITE   = colors.white
GREY    = colors.HexColor('#64748b')
LGREY   = colors.HexColor('#f1f5f9')
DGREY   = colors.HexColor('#0f172a')


def _load_image_bytes(url):
    """Fetch image bytes from URL or local path. Returns None on failure."""
    if not url:
        return None
    try:
        if url.startswith('http'):
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.read()
        elif os.path.exists(url):
            with open(url, 'rb') as f:
                return f.read()
    except Exception:
        pass
    return None


def _make_qr(data_dict):
    """Generate QR code as ReportLab ImageReader."""
    from reportlab.lib.utils import ImageReader
    text = json.dumps(data_dict, ensure_ascii=False)
    qr   = qrcode.QRCode(version=2, box_size=6, border=1,
                          error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(text)
    qr.make(fit=True)
    img  = qr.make_image(fill_color='#032d60', back_color='white')
    buf  = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return ImageReader(buf)


def _draw_rounded_rect(c, x, y, w, h, r, fill_color=None, stroke_color=None, stroke_width=1):
    """Draw a rounded rectangle."""
    c.saveState()
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(stroke_width)
    else:
        c.setLineWidth(0)
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    if fill_color and stroke_color:
        c.drawPath(p, fill=1, stroke=1)
    elif fill_color:
        c.drawPath(p, fill=1, stroke=0)
    else:
        c.drawPath(p, fill=0, stroke=1)
    c.restoreState()


def _draw_photo_circle(c, cx, cy, r, img_bytes):
    """Draw circular student photo or placeholder."""
    from reportlab.lib.utils import ImageReader
    # Draw circle clip
    c.saveState()
    p = c.beginPath()
    p.circle(cx, cy, r)
    c.clipPath(p, stroke=0)
    if img_bytes:
        try:
            ir = ImageReader(io.BytesIO(img_bytes))
            c.drawImage(ir, cx - r, cy - r, 2*r, 2*r, preserveAspectRatio=True, mask='auto')
        except Exception:
            _draw_photo_placeholder(c, cx, cy, r)
    else:
        _draw_photo_placeholder(c, cx, cy, r)
    c.restoreState()
    # Border ring
    c.saveState()
    c.setStrokeColor(WHITE)
    c.setLineWidth(1.5)
    c.circle(cx, cy, r, stroke=1, fill=0)
    c.restoreState()


def _draw_photo_placeholder(c, cx, cy, r):
    c.setFillColor(colors.HexColor('#bfdbfe'))
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont('Helvetica-Bold', r * 0.7)
    c.drawCentredString(cx, cy - r * 0.25, '?')


def _row(c, x, y, label, value, lw=60, col=GREY, vcol=DGREY, fs=6.5):
    """Draw a label:value row."""
    c.setFont('Helvetica', fs)
    c.setFillColor(col)
    c.drawString(x, y, label)
    c.setFont('Helvetica-Bold', fs)
    c.setFillColor(vcol)
    c.drawString(x + lw, y, str(value or '—'))


# ── FRONT SIDE ────────────────────────────────────────────────────────────────
def _draw_front(c, ox, oy, student, school, cls_name):
    from reportlab.lib.utils import ImageReader
    W, H = CW, CH

    # ── Background card ──
    _draw_rounded_rect(c, ox, oy, W, H, 4*mm, fill_color=WHITE, stroke_color=BLUE, stroke_width=0.5)

    # ── Top header gradient band ──
    _draw_rounded_rect(c, ox, oy + H - 20*mm, W, 20*mm, 4*mm, fill_color=NAVY)
    # cover bottom corners of header
    c.setFillColor(NAVY)
    c.rect(ox, oy + H - 20*mm, W, 10*mm, fill=1, stroke=0)

    # ── Gold accent stripe ──
    c.setFillColor(ACCENT)
    c.rect(ox, oy + H - 21.5*mm, W, 1.5*mm, fill=1, stroke=0)

    # ── School Logo ──
    logo_bytes = _load_image_bytes(school.get('logo_url'))
    if logo_bytes:
        try:
            ir = ImageReader(io.BytesIO(logo_bytes))
            c.drawImage(ir, ox + 3*mm, oy + H - 18*mm, 12*mm, 12*mm,
                        preserveAspectRatio=True, mask='auto')
            txt_x = ox + 17*mm
        except Exception:
            txt_x = ox + 4*mm
    else:
        # Circle placeholder for logo
        c.setFillColor(colors.HexColor('#1e40af'))
        c.circle(ox + 8*mm, oy + H - 12*mm, 5*mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 6)
        c.drawCentredString(ox + 8*mm, oy + H - 13*mm, 'LOGO')
        txt_x = ox + 16*mm

    # ── School Name ──
    sname = school.get('name', 'School Name')
    c.setFillColor(WHITE)
    # Truncate long names
    if len(sname) > 22:
        sname = sname[:20] + '..'
    c.setFont('Helvetica-Bold', 7.5)
    c.drawString(txt_x, oy + H - 10*mm, sname.upper())
    city = school.get('city') or school.get('address', '')
    if len(city) > 30:
        city = city[:28] + '..'
    c.setFont('Helvetica', 5.5)
    c.setFillColor(colors.HexColor('#bfdbfe'))
    c.drawString(txt_x, oy + H - 14.5*mm, city)

    # ── ID CARD label ──
    c.setFillColor(ACCENT)
    c.setFont('Helvetica-Bold', 5)
    c.drawRightString(ox + W - 3*mm, oy + H - 17*mm, 'STUDENT ID CARD')

    # ── Student Photo ──
    photo_bytes = _load_image_bytes(student.get('photo_url'))
    photo_cx = ox + W/2
    photo_cy = oy + H - 33*mm
    photo_r  = 9*mm
    # Photo circle background
    _draw_rounded_rect(c, photo_cx - photo_r - 1*mm, photo_cy - photo_r - 1*mm,
                       (photo_r + 1*mm)*2, (photo_r + 1*mm)*2, photo_r + 1*mm,
                       fill_color=LBLUE)
    _draw_photo_circle(c, photo_cx, photo_cy, photo_r, photo_bytes)

    # ── Student Name ──
    name = (student.get('name') or '').upper()
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(NAVY)
    # Fit long name
    while c.stringWidth(name, 'Helvetica-Bold', 9) > W - 6*mm and len(name) > 4:
        name = name[:-2] + '..'
    c.drawCentredString(ox + W/2, oy + H - 44*mm, name)

    # ── Blue divider ──
    c.setStrokeColor(BLUE)
    c.setLineWidth(0.5)
    c.line(ox + 6*mm, oy + H - 46*mm, ox + W - 6*mm, oy + H - 46*mm)

    # ── Info rows — left column ──
    info_y = oy + H - 50*mm
    row_gap = 4.8*mm
    lx = ox + 3.5*mm

    _row(c, lx, info_y,            'Roll No.  :', student.get('roll_number') or '—',  lw=38)
    _row(c, lx, info_y - row_gap,  'Adm. No.  :', student.get('admission_no') or '—', lw=38)
    _row(c, lx, info_y - 2*row_gap,'Class      :', cls_name or '—',                   lw=38)
    _row(c, lx, info_y - 3*row_gap,'Session   :', student.get('session') or '—',      lw=38)
    _row(c, lx, info_y - 4*row_gap,'DOB        :', str(student.get('dob') or '—'),    lw=38)

    # ── Info rows — right column ──
    rx = ox + W/2 + 1*mm
    _row(c, rx, info_y,            'Blood Gr  :', student.get('blood_group') or '—',  lw=38)
    _row(c, rx, info_y - row_gap,  'Father     :', (student.get('father_name') or student.get('parent_name') or '—')[:14], lw=38)
    _row(c, rx, info_y - 2*row_gap,'Mobile    :', student.get('parent_phone') or '—', lw=38)
    _row(c, rx, info_y - 3*row_gap,'Gender    :', student.get('gender') or '—',       lw=38)

    # ── Bottom bar ──
    _draw_rounded_rect(c, ox, oy, W, 7*mm, 4*mm, fill_color=NAVY)
    c.setFillColor(NAVY)
    c.rect(ox, oy + 4*mm, W, 3*mm, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont('Helvetica-Bold', 5.5)
    c.drawCentredString(ox + W/2, oy + 2.5*mm, 'If found, please return to school | ' + (school.get('phone') or ''))


# ── BACK SIDE ─────────────────────────────────────────────────────────────────
def _draw_back(c, ox, oy, student, school):
    W, H = CW, CH

    # Card background
    _draw_rounded_rect(c, ox, oy, W, H, 4*mm, fill_color=WHITE, stroke_color=BLUE, stroke_width=0.5)

    # Top navy band
    _draw_rounded_rect(c, ox, oy + H - 12*mm, W, 12*mm, 4*mm, fill_color=NAVY)
    c.setFillColor(NAVY)
    c.rect(ox, oy + H - 12*mm, W, 6*mm, fill=1, stroke=0)

    # Gold stripe
    c.setFillColor(ACCENT)
    c.rect(ox, oy + H - 13*mm, W, 1*mm, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont('Helvetica-Bold', 7)
    c.drawCentredString(ox + W/2, oy + H - 8*mm, 'STUDENT IDENTITY CARD')
    c.setFont('Helvetica', 5)
    c.setFillColor(colors.HexColor('#bfdbfe'))
    c.drawCentredString(ox + W/2, oy + H - 11*mm, school.get('name', '')[:30])

    # ── QR Code ──
    qr_data = {
        'id':    student.get('id'),
        'name':  student.get('name'),
        'roll':  student.get('roll_number'),
        'adm':   student.get('admission_no'),
        'school':school.get('name'),
        'phone': student.get('parent_phone'),
        'ver':   'EduERP-v1',
    }
    qr_img = _make_qr(qr_data)
    qr_size = 20*mm
    qr_x    = ox + W/2 - qr_size/2
    qr_y    = oy + H - 37*mm
    # QR border box
    _draw_rounded_rect(c, qr_x - 1.5*mm, qr_y - 1.5*mm, qr_size + 3*mm, qr_size + 3*mm,
                       2*mm, fill_color=LGREY, stroke_color=BLUE, stroke_width=0.5)
    c.drawImage(qr_img, qr_x, qr_y, qr_size, qr_size, mask='auto')

    c.setFont('Helvetica-Bold', 5.5)
    c.setFillColor(NAVY)
    c.drawCentredString(ox + W/2, oy + H - 39.5*mm, 'SCAN TO VERIFY')

    # ── School contact ──
    cy = oy + H - 45*mm
    c.setFillColor(LGREY)
    c.roundRect(ox + 3*mm, cy - 8*mm, W - 6*mm, 9*mm, 2*mm, fill=1, stroke=0)

    c.setFont('Helvetica-Bold', 5.5)
    c.setFillColor(NAVY)
    c.drawString(ox + 5*mm, cy - 1*mm, school.get('name', '')[:28])
    c.setFont('Helvetica', 5)
    c.setFillColor(GREY)
    addr = school.get('address') or school.get('city') or ''
    c.drawString(ox + 5*mm, cy - 3.5*mm, addr[:40])
    ph = school.get('phone') or ''
    c.drawString(ox + 5*mm, cy - 6*mm, 'Ph: ' + ph + ('  |  ' + school.get('email', ''))[:35])

    # ── Terms & Conditions ──
    tc_y = oy + H - 57*mm
    c.setFont('Helvetica-Bold', 5.5)
    c.setFillColor(BLUE)
    c.drawString(ox + 3.5*mm, tc_y, 'TERMS & CONDITIONS')
    c.setStrokeColor(BLUE)
    c.setLineWidth(0.4)
    c.line(ox + 3.5*mm, tc_y - 0.8*mm, ox + W - 3.5*mm, tc_y - 0.8*mm)

    terms = [
        '• Card must be carried at all times.',
        '• Lost card must be reported immediately.',
        '• This card is property of the school.',
        '• Misuse will lead to disciplinary action.',
    ]
    c.setFont('Helvetica', 4.8)
    c.setFillColor(DGREY)
    for i, t in enumerate(terms):
        c.drawString(ox + 3.5*mm, tc_y - 3.5*mm - i * 3.8*mm, t)

    # ── Principal Signature ──
    sig_y = oy + 11*mm
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.setLineWidth(0.5)
    c.line(ox + 5*mm, sig_y, ox + 28*mm, sig_y)
    c.setFont('Helvetica-Bold', 5)
    c.setFillColor(NAVY)
    c.drawString(ox + 5*mm, sig_y - 3.5*mm, 'Principal Signature')

    # ── Bottom bar ──
    _draw_rounded_rect(c, ox, oy, W, 7*mm, 4*mm, fill_color=NAVY)
    c.setFillColor(NAVY)
    c.rect(ox, oy + 4*mm, W, 3*mm, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.setFont('Helvetica-Bold', 5)
    session = student.get('session') or '2024-25'
    c.drawCentredString(ox + W/2, oy + 2.5*mm, 'Valid For Session: ' + session)


# ── PUBLIC API ────────────────────────────────────────────────────────────────
def generate_id_card_pdf(student_dict, school_dict, class_name=''):
    """
    Returns a BytesIO PDF with:
      Page 1 — ID card front (centred on A4)
      Page 2 — ID card back  (centred on A4)
    """
    buf = io.BytesIO()
    pw, ph = A4          # 595 x 842 pt
    c = canvas.Canvas(buf, pagesize=A4)

    # ── Page 1: Front ──
    ox = (pw - CW) / 2
    oy = (ph - CH) / 2
    _draw_front(c, ox, oy, student_dict, school_dict, class_name)

    # light watermark text around card
    c.saveState()
    c.setFillColor(colors.HexColor('#e8f4fd'))
    c.setFont('Helvetica', 7)
    c.drawCentredString(pw/2, oy - 8*mm, 'EduERP School Management System — Student ID Card')
    c.restoreState()

    c.showPage()

    # ── Page 2: Back ──
    _draw_back(c, ox, oy, student_dict, school_dict)

    c.saveState()
    c.setFillColor(colors.HexColor('#e8f4fd'))
    c.setFont('Helvetica', 7)
    c.drawCentredString(pw/2, oy - 8*mm, 'EduERP School Management System — Student ID Card')
    c.restoreState()

    c.save()
    buf.seek(0)
    return buf
