// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PortalPage from './pages/PortalPage';
import LandingPage from './pages/LandingPage';
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';
import GradebookManager from './pages/GradebookManager';
import StudentPortal from './pages/StudentPortal';
import AcademicAccountManager from './pages/AcademicAccountManager';
import TeacherDashboard from './pages/TeacherDashboard'; // Import the new dashboard

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main System Portal */}
        <Route path="/" element={<PortalPage />} />

        {/* --- ENROLLMENT SYSTEM ROUTES --- */}
        <Route path="/enrollment-landing" element={<LandingPage />} />
        <Route path="/enroll" element={<EnrollmentForm />} />
        {/* This dashboard is strictly for Enrollment/Section Management */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* --- ACADEMIC RECORDS ROUTES --- */}
        {/* Student View (Login with LRN) */}
        <Route path="/student-portal" element={<StudentPortal />} />
        
        {/* NEW: Unified Faculty Dashboard (Integrates Accounts & Grades) */}
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />

        {/* Standalone Routes (Kept for direct access if needed) */}
		<Route path="/academic-accounts" element={<AcademicAccountManager />} />
        <Route path="/teacher-grades" element={<GradebookManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;