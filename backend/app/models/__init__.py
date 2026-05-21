from app.models.user import User, UserRole
from app.models.school import School

from app.models.financial import FeeStructure, FeeRecord, ExamSchedule, ExamTimetable
from app.models.academic import Class, Teacher, Student, Subject, Marks, Attendance, Note, TeacherAttendance

__all__ = [
    'User', 'UserRole', 'School',
    'Class', 'Subject', 'Teacher', 'Student', 'Attendance', 'Marks', 'Note',
    'FeeStructure', 'FeeRecord', 'ExamSchedule', 'ExamTimetable'
]
