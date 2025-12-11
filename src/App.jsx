// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EnrollmentForm from './pages/EnrollmentForm';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The main page (localhost:5173) shows the Form */}
        <Route path="/" element={<EnrollmentForm />} />
        
        {/* The admin page (localhost:5173/admin) shows the Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;