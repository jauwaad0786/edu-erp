from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io

SCHOOL_BLUE = colors.HexColor('#0176d3')
DARK_BLUE   = colors.HexColor('#032d60')


def generate_admit_card(student, school, exam, timetable_items):
    """Generate PDF admit card for a student."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('title', fontSize=16, textColor=DARK_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4)
    sub_style   = ParagraphStyle('sub', fontSize=11, textColor=SCHOOL_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=2)
    normal      = ParagraphStyle('normal', fontSize=10, fontName='Helvetica')

    elements = []
    elements.append(Paragraph(school.name.upper(), title_style))
    elements.append(Paragraph(f"{school.city or ''} | {school.phone or ''}", sub_style))
    elements.append(HRFlowable(width='100%', color=SCHOOL_BLUE, thickness=2))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph('ADMIT CARD', ParagraphStyle('ac', fontSize=14, textColor=DARK_BLUE,
                                                            alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Paragraph(f"{exam.exam_name} | Session: {exam.session}", sub_style))
    elements.append(Spacer(1, 0.3*cm))

    # Student info table
    info_data = [
        ['Student Name:', student.user.name,    'Roll No:', student.roll_number or 'N/A'],
        ['Admission No:', student.admission_no,  'Class:', student.class_ref.name if student.class_ref else ''],
        ['Father/Guardian:', student.parent_name or '', 'Session:', exam.session],
    ]
    info_table = Table(info_data, colWidths=[3.5*cm, 6*cm, 2.5*cm, 5*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TEXTCOLOR', (0,0), (0,-1), DARK_BLUE),
        ('TEXTCOLOR', (2,0), (2,-1), DARK_BLUE),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.4*cm))
    elements.append(HRFlowable(width='100%', color=colors.lightgrey, thickness=1))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph('EXAMINATION TIMETABLE', ParagraphStyle('tt', fontSize=11,
                                textColor=DARK_BLUE, fontName='Helvetica-Bold', spaceAfter=6)))

    # Timetable
    tt_data = [['#', 'Subject', 'Date', 'Time', 'Venue', 'Max Marks']]
    for i, item in enumerate(timetable_items, 1):
        tt_data.append([
            str(i),
            item.subject.name if item.subject else '',
            str(item.exam_date),
            f"{item.start_time} - {item.end_time}",
            item.venue or 'Main Hall',
            str(item.max_marks)
        ])

    tt_table = Table(tt_data, colWidths=[0.8*cm, 5*cm, 2.5*cm, 4*cm, 3*cm, 2*cm])
    tt_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SCHOOL_BLUE),
        ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f3f2f2')]),
        ('GRID',       (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(tt_table)
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("_____________________", ParagraphStyle('sig', alignment=TA_LEFT)))
    elements.append(Paragraph("Principal's Signature", ParagraphStyle('sigLabel', fontSize=9,
                                fontName='Helvetica', textColor=colors.grey)))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_result_card(student, school, exam, marks_data):
    """Generate PDF result card for a student."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('t', fontSize=16, textColor=DARK_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold')
    sub_style   = ParagraphStyle('s', fontSize=11, textColor=SCHOOL_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold')

    elements = []
    elements.append(Paragraph(school.name.upper(), title_style))
    elements.append(Paragraph(f"{school.city or ''} | {school.phone or ''}", sub_style))
    elements.append(HRFlowable(width='100%', color=SCHOOL_BLUE, thickness=2))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph('PROGRESS REPORT / RESULT CARD',
                               ParagraphStyle('rc', fontSize=14, textColor=DARK_BLUE,
                                              alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Paragraph(f"{exam.exam_name} | Session: {exam.session}", sub_style))
    elements.append(Spacer(1, 0.3*cm))

    info_data = [
        ['Student Name:', student.user.name,      'Roll No:', student.roll_number or 'N/A'],
        ['Admission No:', student.admission_no,   'Class:', student.class_ref.name if student.class_ref else ''],
        ['Father/Guardian:', student.parent_name or '', 'Session:', exam.session],
    ]
    info_table = Table(info_data, colWidths=[3.5*cm, 6*cm, 2.5*cm, 5*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TEXTCOLOR', (0,0), (0,-1), DARK_BLUE),
        ('TEXTCOLOR', (2,0), (2,-1), DARK_BLUE),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.4*cm))

    # Marks table
    marks_rows = [['Subject', 'Max Marks', 'Marks Obtained', 'Percentage', 'Grade', 'Status']]
    total_max, total_obtained = 0, 0
    for m in marks_data:
        pct = round((m['marks_obtained'] / m['max_marks'] * 100), 1) if m['max_marks'] else 0
        status = 'PASS' if m['marks_obtained'] >= (m['max_marks'] * 0.33) else 'FAIL'
        marks_rows.append([
            m['subject_name'], str(m['max_marks']), str(m['marks_obtained']),
            f"{pct}%", m.get('grade', _get_grade(pct)), status
        ])
        total_max += m['max_marks']
        total_obtained += m['marks_obtained']

    overall_pct = round(total_obtained / total_max * 100, 1) if total_max else 0
    marks_rows.append(['TOTAL', str(total_max), str(total_obtained),
                       f"{overall_pct}%", _get_grade(overall_pct), 'PASS' if overall_pct >= 33 else 'FAIL'])

    marks_table = Table(marks_rows, colWidths=[5*cm, 2.5*cm, 3.5*cm, 2.5*cm, 1.5*cm, 2*cm])
    marks_table.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), SCHOOL_BLUE),
        ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME',    (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND',  (0,-1), (-1,-1), colors.HexColor('#e8f4fd')),
        ('FONTSIZE',    (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, colors.HexColor('#f3f2f2')]),
        ('GRID',        (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('ALIGN',       (1,0), (-1,-1), 'CENTER'),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(marks_table)
    elements.append(Spacer(1, 0.5*cm))

    result_text = f"Overall Result: {'PASS' if overall_pct >= 33 else 'FAIL'} | Percentage: {overall_pct}% | Grade: {_get_grade(overall_pct)}"
    elements.append(Paragraph(result_text, ParagraphStyle('res', fontSize=11,
                                textColor=DARK_BLUE, fontName='Helvetica-Bold', alignment=TA_CENTER)))

    doc.build(elements)
    buffer.seek(0)
    return buffer
def generate_admission_card(student, school):
    """
    Generate admission registration card for a newly admitted student.
    Real school-style — border, school header, student info, photo box.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)

    title_style = ParagraphStyle('t', fontSize=18, textColor=DARK_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold',
                                  spaceAfter=4)
    sub_style   = ParagraphStyle('s', fontSize=11, textColor=SCHOOL_BLUE,
                                  alignment=TA_CENTER, fontName='Helvetica-Bold',
                                  spaceAfter=2)
    label_style = ParagraphStyle('l', fontSize=9,  fontName='Helvetica-Bold',
                                  textColor=DARK_BLUE)
    value_style = ParagraphStyle('v', fontSize=10, fontName='Helvetica')
    center_bold = ParagraphStyle('cb', fontSize=13, fontName='Helvetica-Bold',
                                  textColor=DARK_BLUE, alignment=TA_CENTER)

    elements = []

    # ── School Header ──
    elements.append(Paragraph(school.name.upper(), title_style))
    elements.append(Paragraph(
        f"{school.address or ''} | {school.city or ''} | Ph: {school.phone or ''}",
        sub_style
    ))
    elements.append(HRFlowable(width='100%', color=SCHOOL_BLUE, thickness=3))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph('ADMISSION REGISTRATION CARD', center_bold))
    elements.append(Spacer(1, 0.4*cm))
    elements.append(HRFlowable(width='100%', color=colors.lightgrey, thickness=1))
    elements.append(Spacer(1, 0.4*cm))

    # ── Student info + Photo box side by side ──
    cls  = student.class_ref
    info = [
        ['Admission No.',  student.admission_no  or 'N/A'],
        ['Student Name',   student.user.name     if student.user else ''],
        ['Father / Guardian', student.parent_name or ''],
        ['Mobile No.',     student.parent_phone  or ''],
        ['Class / Section', f"{cls.name} — {cls.section}" if cls else ''],
        ['Roll Number',    student.roll_number   or ''],
        ['Gender',         student.gender        or ''],
        ['Session',        student.session       or ''],
        ['Date of Admission', student.created_at.strftime('%d-%m-%Y')
                              if hasattr(student, 'created_at') and student.created_at
                              else ''],
    ]

    # left: info table | right: photo box
    info_rows = []
    for label, value in info:
        info_rows.append([
            Paragraph(label, label_style),
            Paragraph(value,  value_style),
        ])

    info_table = Table(info_rows, colWidths=[4.5*cm, 9*cm])
    info_table.setStyle(TableStyle([
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
        ('BACKGROUND',    (0,0), (0,-1), colors.HexColor('#f8faff')),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))

    # Photo placeholder box
    photo_box = Table(
        [[Paragraph('Photo', ParagraphStyle('ph', fontSize=9,
                    alignment=TA_CENTER, textColor=colors.grey))]],
        colWidths=[3*cm], rowHeights=[3.5*cm]
    )
    photo_box.setStyle(TableStyle([
        ('BOX',        (0,0), (-1,-1), 1, colors.grey),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8faff')),
    ]))

    # Combine side by side
    combined = Table(
        [[info_table, photo_box]],
        colWidths=[13.5*cm, 3.5*cm]
    )
    combined.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',  (1,0), (1,0), 8),
    ]))
    elements.append(combined)
    elements.append(Spacer(1, 0.8*cm))

    # ── Rules / Instructions ──
    elements.append(HRFlowable(width='100%', color=colors.lightgrey, thickness=1))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph('IMPORTANT INSTRUCTIONS', ParagraphStyle(
        'inst', fontSize=9, fontName='Helvetica-Bold', textColor=DARK_BLUE, spaceAfter=4
    )))
    for line in [
        '1. Ye card school premises mein hamesha saath rakhein.',
        '2. Fee har mahine 10 tarikh tak jama karein.',
        '3. Koi bhi changes ke liye school office se sampark karein.',
        '4. Is card ko kho jane par turant principal ko soochit karein.',
    ]:
        elements.append(Paragraph(line, ParagraphStyle(
            'il', fontSize=8, fontName='Helvetica',
            textColor=colors.grey, spaceAfter=3
        )))

    elements.append(Spacer(1, 1*cm))

    # ── Signatures ──
    sig_data = [[
        Paragraph("_____________________\nParent's Signature",
                  ParagraphStyle('sig', fontSize=8, fontName='Helvetica',
                                  textColor=colors.grey, alignment=TA_CENTER)),
        Paragraph("_____________________\nClass Teacher's Signature",
                  ParagraphStyle('sig2', fontSize=8, fontName='Helvetica',
                                  textColor=colors.grey, alignment=TA_CENTER)),
        Paragraph("_____________________\nPrincipal's Signature",
                  ParagraphStyle('sig3', fontSize=8, fontName='Helvetica',
                                  textColor=colors.grey, alignment=TA_CENTER)),
    ]]
    sig_table = Table(sig_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer

def _get_grade(pct):
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C'
    if pct >= 33: return 'D'
    return 'F'
