// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FeeProvider } from './context/FeeContext'; // Import Context Provider
import PortalPage from './pages/PortalPage';
import LandingPage from './pages/LandingPage';
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';
import GradebookManager from './pages/GradebookManager';
import StudentPortal from './pages/StudentPortal';
import AcademicAccountManager from './pages/AcademicAccountManager';
import TeacherDashboard from './pages/TeacherDashboard'; 
import FeeManager from './pages/FeeManager'; // Import the new Fee Manager Page

function App() {
  return (
    // Wrap the entire app in FeeProvider so FeeContext is accessible everywhere
    <FeeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main System Portal */}
          <Route path="/" element={<PortalPage />} />

          {/* --- ENROLLMENT SYSTEM ROUTES --- */}
          <Route path="/enrollment-landing" element={<LandingPage />} />
          <Route path="/enroll" element={<EnrollmentForm />} />
          
          {/* Fee Manager Route: Placed BEFORE /admin/* to ensure it takes precedence */}
          <Route path="/admin/fees" element={<FeeManager />} />
          
          {/* This dashboard is strictly for Enrollment/Section Management */}
          <Route path="/admin/*" element={<AdminDashboard />} />
          
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
    </FeeProvider>
  );
}

export default App;