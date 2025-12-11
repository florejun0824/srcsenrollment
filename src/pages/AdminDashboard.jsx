// src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'; 
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { PDFDownloadLink } from '@react-pdf/renderer';
import EnrollmentPDF from '../components/EnrollmentPDF';

// --- ICONS ---
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;
const FilterIcon = () => <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;
const DownloadIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>;
const TrashIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const WarningIcon = () => <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

// --- DELETE MODAL ---
const DeleteModal = ({ isOpen, onClose, onConfirm, studentName, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
           <WarningIcon />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-2">Delete Record?</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Permanently delete <strong>{studentName}</strong>? This cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
           <button onClick={onConfirm} disabled={isDeleting} className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-sm">
             {isDeleting ? 'Deleting...' : 'Yes, Delete'}
           </button>
           <button onClick={onClose} disabled={isDeleting} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm">
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7] text-gray-400 text-xs font-bold animate-pulse">VERIFYING...</div>;

  return user ? <DashboardView user={user} /> : <LoginView />;
};

// --- LOGIN VIEW ---
const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid credentials.");
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#800000]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100">
           <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-900/20">
                <img src="/1.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
              </div>
              <h1 className="text-xl font-black text-gray-900">Admin Portal</h1>
              <p className="text-[10px] font-bold text-[#800000] uppercase tracking-widest mt-1">San Ramon Catholic School</p>
           </div>
           <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="ADMIN ID" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#800000]/20 outline-none" required />
              <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#800000]/20 outline-none" required />
              {error && <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 py-2 rounded-lg">{error}</div>}
              <button type="submit" disabled={isLoggingIn} className="w-full bg-[#800000] hover:bg-[#600000] text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition-all mt-2">
                {isLoggingIn ? '...' : 'LOGIN'}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const schoolYearOptions = Array.from({ length: 10 }, (_, i) => {
    const start = currentYear + 1 + i;
    return `${start}-${start + 1}`;
  });
  const [selectedYear, setSelectedYear] = useState(schoolYearOptions[0]);
  const [selectedGrade, setSelectedGrade] = useState('All');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "enrollments"), where("schoolYear", "==", selectedYear));
        const snapshot = await getDocs(q);
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedData.sort((a, b) => a.lastName.localeCompare(b.lastName));
        setStudents(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [selectedYear]);

  const initiateDelete = (id, studentName) => setDeleteModal({ show: true, id, name: studentName });
  const confirmDelete = async () => {
      if (!deleteModal.id) return;
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "enrollments", deleteModal.id));
        setStudents(prev => prev.filter(student => student.id !== deleteModal.id));
        setDeleteModal({ show: false, id: null, name: '' });
      } catch (error) { alert("Failed to delete record."); }
      setIsDeleting(false);
  };

  const filteredStudents = selectedGrade === 'All' ? students : students.filter(student => student.gradeLevel === selectedGrade);
  const totalStudents = filteredStudents.length;
  const maleCount = filteredStudents.filter(s => s.sex === 'Male').length;
  const femaleCount = filteredStudents.filter(s => s.sex === 'Female').length;
  const returningCount = filteredStudents.filter(s => s.lrnStatus === 'Returning').length;
  const newCount = totalStudents - returningCount;

  return (
    <div className="h-screen bg-[#F5F5F7] font-sans text-gray-800 flex flex-col overflow-hidden">
      <DeleteModal isOpen={deleteModal.show} onClose={() => setDeleteModal({ show: false, id: null, name: '' })} onConfirm={confirmDelete} studentName={deleteModal.name} isDeleting={isDeleting} />

      {/* 1. HEADER ROW (COMPACT) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 shrink-0 h-16">
          <div className="flex items-center gap-3">
             <img src="/1.png" alt="Logo" className="w-9 h-9 object-contain" />
             <div className="leading-tight">
                <h1 className="text-sm font-black text-gray-900 tracking-tight">ADMIN DASHBOARD</h1>
                <p className="text-[10px] font-bold text-[#800000]">SY {selectedYear}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="hidden md:block text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{user.email}</span>
             <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all flex items-center gap-2 group">
                <LogoutIcon />
                <span className="hidden md:inline text-xs font-bold">Logout</span>
             </button>
          </div>
      </div>

      {/* 2. STATS & FILTERS CONTAINER */}
      <div className="shrink-0 bg-white border-b border-gray-200 p-3 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] z-10">
         <div className="max-w-5xl mx-auto space-y-3">
            
            {/* COMPACT STATS ROW */}
            <div className="grid grid-cols-3 gap-3">
                {/* Total */}
                <div className="bg-[#800000] text-white p-2.5 rounded-xl shadow-lg shadow-red-900/20 flex flex-col justify-center items-center text-center">
                   <span className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Total</span>
                   <span className="text-2xl font-black leading-none">{totalStudents}</span>
                </div>
                
                {/* Gender */}
                <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl flex flex-col justify-center gap-1.5">
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 border-b border-gray-100 pb-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Male</span>
                      <span>{maleCount}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>Fem</span>
                      <span>{femaleCount}</span>
                   </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl flex flex-col justify-center gap-1.5">
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 border-b border-gray-100 pb-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Old</span>
                      <span>{returningCount}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>New</span>
                      <span>{newCount}</span>
                   </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex gap-2">
               <div className="relative w-1/3">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><FilterIcon /></div>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 focus:bg-white focus:ring-1 focus:ring-[#800000] outline-none appearance-none">
                     {schoolYearOptions.map(y => <option key={y} value={y}>SY {y}</option>)}
                  </select>
               </div>
               <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="w-2/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 focus:bg-white focus:ring-1 focus:ring-[#800000] outline-none">
                  <option value="All">All Grade Levels</option>
                  <option value="Pre-Kindergarten 1">Pre-Kinder 1</option>
                  <option value="Pre-Kindergarten 2">Pre-Kinder 2</option>
                  <option value="Kinder">Kinder</option>
                  {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (SHS)', 'Grade 12 (SHS)'].map(g => (<option key={g} value={g}>{g}</option>))}
               </select>
            </div>
         </div>
      </div>

      {/* 3. SCROLLABLE DATA LIST */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="max-w-5xl mx-auto">
             {loading ? (
                 <div className="flex flex-col items-center justify-center pt-20 text-gray-300 gap-2">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-[#800000] rounded-full animate-spin"/>
                    <span className="text-[10px] font-bold tracking-widest">LOADING...</span>
                 </div>
             ) : filteredStudents.length === 0 ? (
                 <div className="flex flex-col items-center justify-center pt-20 text-gray-300">
                    <span className="text-4xl mb-2">📂</span>
                    <span className="text-xs font-bold uppercase tracking-widest">No records found</span>
                 </div>
             ) : (
                 <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                    {filteredStudents.map((s) => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#800000]/30 transition-colors">
                           <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full -mr-6 -mt-6 transition-colors group-hover:bg-red-50"></div>

                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#800000] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-red-900/10">{s.lastName.charAt(0)}</div>
                                  <div className="flex flex-col">
                                     <h3 className="text-xs font-extrabold text-gray-800 leading-tight">{s.lastName}, {s.firstName}</h3>
                                     <span className="text-[10px] font-semibold text-gray-400 uppercase">{s.gradeLevel}</span>
                                  </div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${s.lrnStatus === 'Returning' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                 {s.lrnStatus === 'Returning' ? 'Old' : 'New'}
                              </span>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                              <div><span className="text-gray-400 text-[9px] uppercase font-bold block mb-0.5">LRN</span>{s.lrn || 'N/A'}</div>
                              <div><span className="text-gray-400 text-[9px] uppercase font-bold block mb-0.5">Sex</span>{s.sex}</div>
                              {s.track && <div className="col-span-2 border-t border-gray-200 pt-1 mt-0.5"><span className="text-gray-400 text-[9px] uppercase font-bold block mb-0.5">Track</span>{s.track}</div>}
                           </div>

                           <div className="flex gap-2 mt-auto">
                              <PDFDownloadLink document={<EnrollmentPDF data={s} />} fileName={`${s.lastName}_Form.pdf`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-600 hover:border-[#800000] hover:text-[#800000] transition-colors shadow-sm">
                                 {({ loading }) => (loading ? '...' : <><DownloadIcon /> PDF</>)}
                              </PDFDownloadLink>
                              <button onClick={() => initiateDelete(s.id, s.firstName)} className="w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm">
                                 <TrashIcon />
                              </button>
                           </div>
                        </div>
                    ))}
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;