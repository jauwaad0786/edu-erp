// frontend/src/App.jsx — FULL REPLACE

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider }    from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import DocumentsPage from './pages/DocumentsPage';

// Pages
import Landing             from './pages/Landing';
import Login               from './pages/Login';
import DashboardRouter     from './pages/DashboardRouter';
import StudentsPage        from './pages/StudentsPage';
import TeachersPage        from './pages/TeachersPage';
import ClassesPage         from './pages/ClassesPage';
import FeesPage            from './pages/FeesPage';
import ExamsPage           from './pages/ExamsPage';
import SchoolDetailPage    from './pages/SchoolDetailPage';
import AttendancePage      from './pages/AttendancePage';
import NewAdmissionPage    from './pages/NewAdmissionPage';
import StudentProfile      from './pages/StudentProfile';
import ClassDetailPage     from './pages/ClassDetailPage';
import TeacherProfile      from './pages/TeacherProfile';
import HolidaysPage from './pages/HolidaysPage';
import NotesPage    from './pages/NotesPage';
import SubjectsPage   from './pages/SubjectsPage';
import TimetablePage  from './pages/TimetablePage';
import IDCardPage from './pages/IDCardPage';
// routes mein:


export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Router>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* ── Dashboard (role-based router) ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />

          {/* ── Principal / Teacher / Admin ── */}
          <Route path="/students" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <StudentsPage />
            </ProtectedRoute>
          } />
          <Route path="/students/:id" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="/teachers" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <TeachersPage />
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <ClassesPage />
            </ProtectedRoute>
          } />
          <Route path="/classes/:id" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <ClassDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/teachers/:id" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <TeacherProfile />
            </ProtectedRoute>
          } />
          <Route path="/fees" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'STUDENT', 'PARENT']}>
              <FeesPage />
            </ProtectedRoute>
          } />
          <Route path="/admission" element={
          <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
            <NewAdmissionPage />
          </ProtectedRoute>
        } />
          <Route path="/attendance" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <AttendancePage />
            </ProtectedRoute>
          } />
          
          <Route path="/marks" element={
            <ProtectedRoute roles={['TEACHER', 'PRINCIPAL']}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/holidays" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <HolidaysPage />
            </ProtectedRoute>
          } />
          <Route path="/notes" element={
            <ProtectedRoute roles={['TEACHER', 'PRINCIPAL', 'STUDENT']}>
              <NotesPage />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <DocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/exams" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <ExamsPage />
            </ProtectedRoute>
          } />
          <Route path="/timetable" element={
            <ProtectedRoute roles={['PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT']}>
              <TimetablePage />
            </ProtectedRoute>
          } />
          <Route path="/id-cards" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <IDCardPage />
            </ProtectedRoute>
          } />

          <Route path="/subjects" element={
            <ProtectedRoute roles={['PRINCIPAL', 'TEACHER']}>
              <SubjectsPage />
            </ProtectedRoute>
          } />

          {/* ── Super Admin only ── */}
          {/* ── Super Admin only ── */}
          <Route path="/schools" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/schools/:id" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <SchoolDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}
