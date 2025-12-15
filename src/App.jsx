// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PortalPage from './pages/PortalPage';
import LandingPage from './pages/LandingPage';
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';
import GradebookManager from './pages/GradebookManager';
import StudentPortal from './pages/StudentPortal';
import AcademicAccountManager from './pages/AcademicAccountManager';

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
		<Route path="/academic-accounts" element={<AcademicAccountManager />} />
        
        {/* Teacher View (Standalone Gradebook Manager) */}
        <Route path="/teacher-grades" element={<GradebookManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;