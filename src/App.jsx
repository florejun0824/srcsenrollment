// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage'; // New Component
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. The Landing Page is now the default (Home) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 2. The Enrollment Form has its own path */}
        <Route path="/enroll" element={<EnrollmentForm />} />
        
        {/* 3. The Admin Dashboard remains the same */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;