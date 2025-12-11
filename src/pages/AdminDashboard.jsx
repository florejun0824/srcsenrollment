// src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'; 
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { PDFDownloadLink } from '@react-pdf/renderer';
import EnrollmentPDF from '../components/EnrollmentPDF';

// --- ICONS ---
const LogoutIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;
const FilterIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const UsersIcon = () => <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;

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

  if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7] text-gray-400 text-sm">Loading Workspace...</div>;

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
      setError("Access Denied. Incorrect credentials.");
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
             <span className="text-2xl">🔐</span>
           </div>
           <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
           <p className="text-xs text-gray-500 font-medium mt-1">San Ramon Catholic School</p>
        </div>

        <div className="bg-white p-2 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100">
           <form onSubmit={handleLogin} className="p-6 space-y-4">
              <input type="email" placeholder="Administrator ID" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#800000]/20 transition-all outline-none" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#800000]/20 transition-all outline-none" required />
              {error && <div className="text-red-500 text-[11px] font-bold text-center py-1">{error}</div>}
              <button type="submit" disabled={isLoggingIn} className="w-full bg-[#1a1a1a] hover:bg-black text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-gray-200 transition-all active:scale-[0.98]">
                {isLoggingIn ? 'Authenticating...' : 'Enter Dashboard'}
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
  const [deletingId, setDeletingId] = useState(null);
  
  // DYNAMIC SCHOOL YEAR GENERATION
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

  const handleDelete = async (id, studentName) => {
    if (window.confirm(`Are you sure you want to permanently delete the record for ${studentName}?`)) {
      setDeletingId(id);
      try {
        await deleteDoc(doc(db, "enrollments", id));
        setStudents(prev => prev.filter(student => student.id !== id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete record.");
      }
      setDeletingId(null);
    }
  };

  // FILTERING LOGIC
  const filteredStudents = selectedGrade === 'All' 
    ? students 
    : students.filter(student => student.gradeLevel === selectedGrade);

  // --- STATS CALCULATION ---
  const totalStudents = filteredStudents.length;
  const maleCount = filteredStudents.filter(s => s.sex === 'Male').length;
  const femaleCount = filteredStudents.filter(s => s.sex === 'Female').length;
  const returningCount = filteredStudents.filter(s => s.lrnStatus === 'Returning').length;
  const newCount = totalStudents - returningCount;

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6 font-sans text-gray-800">
      <div className="max-w-[1200px] mx-auto bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[88vh]">
         
         {/* HEADER */}
         <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#800000] rounded-xl flex items-center justify-center text-white font-bold shadow-sm">SR</div>
                <div>
                   <h1 className="text-lg font-bold text-gray-900 tracking-tight">Records Database</h1>
                   <p className="text-xs font-medium text-gray-400">School Year {selectedYear}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
               <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hidden md:block">{user.email}</span>
               <button onClick={() => signOut(auth)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title="Logout"><LogoutIcon /></button>
            </div>
         </div>

         {/* TOOLBAR */}
         <div className="px-8 py-4 bg-white border-b border-gray-50 flex flex-wrap gap-3 items-center">
            
            {/* Year Dropdown */}
            <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><FilterIcon /></div>
               <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:bg-white focus:ring-2 focus:ring-gray-100 outline-none appearance-none cursor-pointer transition-all min-w-[140px]"
               >
                  {schoolYearOptions.map(year => (
                    <option key={year} value={year}>SY {year}</option>
                  ))}
               </select>
            </div>

            {/* Grade Dropdown */}
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:bg-white focus:ring-2 focus:ring-gray-100 outline-none cursor-pointer transition-all min-w-[140px]">
               <option value="All">All Levels</option>
               <option value="Kinder">Kinder</option>
               {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (SHS)', 'Grade 12 (SHS)'].map(g => (<option key={g} value={g}>{g}</option>))}
            </select>
         </div>

         {/* --- ENROLLMENT SUMMARY SECTION (Added) --- */}
         <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Total Enrolled */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Enrolled</p>
                   <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-gray-800">{totalStudents}</span>
                       <span className="text-xs font-medium text-gray-500">{selectedGrade === 'All' ? 'Across All Levels' : selectedGrade}</span>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                   <UsersIcon />
                </div>
            </div>

            {/* Card 2: Gender Stats */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gender Ratio</p>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {maleCount} Male
                    </div>
                    <div className="flex items-center gap-1.5 text-pink-700">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        {femaleCount} Female
                    </div>
                </div>
            </div>

            {/* Card 3: Student Status */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Student Status</p>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-purple-700">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        {returningCount} Returning
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {newCount} New / Transferee
                    </div>
                </div>
            </div>
         </div>

         {/* DATA TABLE (Scrollable Area) */}
         <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"/>
                  <span className="text-xs font-medium">Fetching Records...</span>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                     <tr>
                        <th className="py-3 px-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[35%]">Student Name</th>
                        <th className="py-3 px-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Level & Track</th>
                        <th className="py-3 px-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="py-3 px-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredStudents.length === 0 ? (
                        <tr><td colSpan="4" className="py-24 text-center text-gray-400 text-sm">No records found.</td></tr>
                     ) : (
                        filteredStudents.map((s) => (
                           <tr key={s.id} className="group hover:bg-gray-50/80 transition-colors">
                              <td className="py-4 px-8">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#800000]/5 text-[#800000] flex items-center justify-center text-xs font-bold">{s.lastName.charAt(0)}</div>
                                    <div>
                                       <div className="text-sm font-bold text-gray-800">{s.lastName}, {s.firstName}</div>
                                       <div className="text-[10px] text-gray-400 font-medium">LRN: {s.lrn || 'N/A'}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-4 px-8">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">{s.gradeLevel}</span>
                                    {s.track && <span className="text-[10px] text-gray-400">{s.track} {s.strand ? `• ${s.strand}` : ''}</span>}
                                 </div>
                              </td>
                              <td className="py-4 px-8">
                                 <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${s.lrnStatus === 'Returning' ? 'bg-purple-50 text-purple-700' : s.lrnStatus === 'No LRN' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>{s.lrnStatus || 'Standard'}</span>
                              </td>
                              <td className="py-4 px-8 text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <PDFDownloadLink document={<EnrollmentPDF data={s} />} fileName={`${s.lastName}_Enrollment.pdf`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-[#800000] hover:text-[#800000] transition-all shadow-sm">
                                        {({ loading }) => (loading ? '...' : <><DownloadIcon /> PDF</>)}
                                     </PDFDownloadLink>
                                     <button onClick={() => handleDelete(s.id, s.firstName)} disabled={deletingId === s.id} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all" title="Delete Record">
                                       {deletingId === s.id ? (<div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>) : (<TrashIcon />)}
                                     </button>
                                </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;