import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import StudentsPage   from './pages/StudentsPage';
import TeachersPage   from './pages/TeachersPage';
import ClassesPage    from './pages/ClassesPage';
import FeesPage       from './pages/FeesPage';
import ExamsPage      from './pages/ExamsPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected — any role */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />

          {/* Principal / Admin routes */}
          <Route path="/students" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'TEACHER']}>
              <StudentsPage />
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
          <Route path="/fees" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN', 'STUDENT', 'PARENT']}>
              <FeesPage />
            </ProtectedRoute>
          } />
          <Route path="/exams" element={
            <ProtectedRoute roles={['PRINCIPAL', 'SUPER_ADMIN']}>
              <ExamsPage />
            </ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/schools" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <DashboardRouter />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
