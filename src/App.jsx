// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PortalPage from './pages/PortalPage'; // NEW COMPONENT
import LandingPage from './pages/LandingPage'; 
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. The new Portal Page is now the default (Home) */}
        <Route path="/" element={<PortalPage />} />
        
        {/* 2. The old Landing Page is now specifically for the Enrollment System */}
        <Route path="/enrollment-landing" element={<LandingPage />} /> 

        {/* 3. The Enrollment Form remains the same */}
        <Route path="/enroll" element={<EnrollmentForm />} />
        
        {/* 4. The Admin Dashboard remains the same */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;