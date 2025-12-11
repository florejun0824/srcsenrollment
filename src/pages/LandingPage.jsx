// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#800000]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FFD700]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="w-28 h-28 bg-white rounded-full shadow-xl shadow-[#800000]/10 mx-auto flex items-center justify-center mb-6 p-4">
             <img src="/1.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#800000] tracking-tight mb-2">SAN RAMON</h1>
          <p className="text-[#FFD700] text-sm md:text-base font-bold uppercase tracking-[0.3em] bg-[#800000] px-4 py-1 rounded-full inline-block">Catholic School, Inc.</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          {/* OPTION 1: ENROLL */}
          <Link to="/enroll" className="group relative overflow-hidden bg-white hover:bg-[#800000] border-2 border-transparent hover:border-[#800000] p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center gap-4 group-hover:-translate-y-2">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-white/20 transition-colors">
              🎓
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 group-hover:text-white mb-2">Enroll Learner</h2>
              <p className="text-gray-500 text-sm group-hover:text-white/80 font-medium">
                Register a new student or update an existing record for the upcoming school year.
              </p>
            </div>
            <div className="mt-4 px-6 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:bg-white group-hover:text-[#800000]">
              Proceed to Form →
            </div>
          </Link>

          {/* OPTION 2: ADMIN */}
          <Link to="/admin" className="group relative overflow-hidden bg-white hover:bg-gray-900 border-2 border-transparent hover:border-gray-900 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center gap-4 group-hover:-translate-y-2">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-white/20 transition-colors">
              🛡️
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 group-hover:text-white mb-2">Admin Portal</h2>
              <p className="text-gray-500 text-sm group-hover:text-white/80 font-medium">
                Authorized personnel login to manage enrollments and view student records.
              </p>
            </div>
            <div className="mt-4 px-6 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:bg-white group-hover:text-gray-900">
              Enter Dashboard →
            </div>
          </Link>

        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-gray-400 text-xs font-semibold uppercase tracking-widest">
        © {new Date().getFullYear()} Official Enrollment System
      </div>
    </div>
  );
};

export default LandingPage;