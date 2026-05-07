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


def _get_grade(pct):
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C'
    if pct >= 33: return 'D'
    return 'F'
