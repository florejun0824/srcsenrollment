// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Link } from 'react-router-dom';

// IMPORT COMPONENTS
import { Icons } from '../utils/Icons';
import ConfirmationModal from '../components/admin/ConfirmationModal';
import VerificationModal from '../components/admin/VerificationModal';
import TransferPromoteModal from '../components/admin/TransferPromoteModal';
import SectionManager from '../components/admin/SectionManager';
import MasterList from '../components/admin/MasterList';
import StudentRow from '../components/admin/StudentRow';
import EnrollmentAnalytics from '../components/admin/EnrollmentAnalytics'; 

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
        ${active 
            ? 'bg-gradient-to-r from-[#800000] to-red-900 text-white shadow-lg shadow-red-900/20 border border-white/10' 
            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
        }`}
    >
        <div className={`transition-colors relative z-10 ${active ? 'text-white' : 'text-slate-500 group-hover:text-red-400'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold tracking-widest uppercase relative z-10">{label}</span>
        {active && <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>}
    </button>
);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left min-w-[100px] relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`}></div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${color} shrink-0 border border-white/10 relative z-10`}>
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
            <h3 className="text-2xl font-black text-white leading-none mt-1 group-hover:scale-105 transition-transform">{value}</h3>
        </div>
    </div>
);

const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleLogin = async (e) => { 
        e.preventDefault(); 
        setLoading(true); 
        setError(''); 
        try { 
            await signInWithEmailAndPassword(auth, email, password); 
        } catch (err) { 
            setError('Access Denied. Invalid credentials.'); 
        } 
        setLoading(false); 
    };
    
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/90" />
            </div>

            <div className="bg-slate-900/80 p-10 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border border-white/10 backdrop-blur-xl animate-fade-in-up">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#800000] to-red-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-red-900/20 border border-white/10">
                        <img src="/1.png" className="w-12 h-12 object-contain drop-shadow-md" alt="Logo"/>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Admin Portal</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Restricted Access</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <input 
                            type="email" 
                            placeholder="ADMIN ID" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-red-500/50 focus:bg-white/5 transition-all placeholder:text-slate-600" 
                            required 
                        />
                    </div>
                    <div className="space-y-1">
                        <input 
                            type="password" 
                            placeholder="PASSWORD" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-red-500/50 focus:bg-white/5 transition-all placeholder:text-slate-600" 
                            required 
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-400 text-[10px] font-bold text-center bg-red-900/20 py-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
                            {Icons.alert} {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-gradient-to-r from-[#800000] to-red-800 hover:to-red-700 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-red-900/30 transition-all hover:-translate-y-1 border border-white/5"
                    >
                        {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
                    </button>
                </form>
                
                <Link to="/enrollment-landing" className="flex items-center justify-center gap-2 mt-8 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors group">
                    <span className="group-hover:-translate-x-1 transition-transform">{Icons.arrowLeft}</span> Back to Main Menu
                </Link>
            </div>
        </div>
    );
};

const DashboardLayout = ({ user }) => {
    // --- STATE ---
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedYear, setSelectedYear] = useState('2026-2027');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- MODAL STATE ---
    const [verifyModal, setVerifyModal] = useState(null); 
    const [transferModal, setTransferModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // --- FETCH DATA ---
    useEffect(() => { fetchStudents(); fetchSections(); }, [selectedYear]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "enrollments"), where("schoolYear", "==", selectedYear)); 
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setStudents(data.map(s => ({ ...s, status: s.status || 'Pending' })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchSections = async () => {
        try {
            const q = query(collection(db, "sections"));
            const snap = await getDocs(q);
            setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error("Error fetching sections:", err); }
    };

    // --- ACTIONS ---
    const confirmAction = (title, message, action, type='danger') => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm: async () => { await action(); setConfirmModal({ ...confirmModal, isOpen: false }); } });
    };

    const handleApprove = async (id, studentID, section) => {
        confirmAction("Confirm Enrollment?", "This student will be officially enrolled.", async () => {
            await updateDoc(doc(db, "enrollments", id), { status: 'Enrolled', studentID, section, enrolledAt: new Date() });
            setVerifyModal(null);
            fetchStudents();
        }, 'info');
    };

    const handleReject = async (id) => {
        confirmAction("Reject Application?", "This action cannot be undone.", async () => {
            await updateDoc(doc(db, "enrollments", id), { status: 'Rejected' });
            setVerifyModal(null);
            fetchStudents();
        });
    };

    const handleDelete = async (student) => {
        confirmAction("Delete Record?", `Permanently delete ${student.lastName}?`, async () => {
            await deleteDoc(doc(db, "enrollments", student.id));
            fetchStudents();
        });
    };

    const handleTransferPromote = async (student, { targetSection, targetYear, targetGrade }) => {
        const isPromo = targetYear !== student.schoolYear;
        confirmAction(isPromo ? "Promote Student?" : "Transfer Section?", `Confirm move to ${targetSection}?`, async () => {
            if (isPromo) {
                const newRecord = { ...student, schoolYear: targetYear, gradeLevel: targetGrade, section: targetSection, status: 'Enrolled', enrolledAt: new Date(), createdAt: new Date(), studentType: 'Returning' };
                delete newRecord.id; 
                await addDoc(collection(db, "enrollments"), newRecord);
            } else {
                await updateDoc(doc(db, "enrollments", student.id), { section: targetSection });
            }
            setTransferModal(null);
            setVerifyModal(null);
            fetchStudents();
        }, 'info');
    };

    const handleAddSection = async (name, gradeLevel) => { try { await addDoc(collection(db, "sections"), { name, gradeLevel, createdAt: serverTimestamp() }); fetchSections(); } catch(e) { alert("Failed."); } };
    const handleDeleteSection = async (section) => { confirmAction("Delete Section?", `Delete ${section.name}?`, async () => { await deleteDoc(doc(db, "sections", section.id)); fetchSections(); }); };

    // --- FILTERING ---
    const filtered = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.lastName.toLowerCase().includes(search.toLowerCase()) || s.firstName.toLowerCase().includes(search.toLowerCase()) || (s.lrn && s.lrn.includes(search));
            const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [students, search, filterStatus]);

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        const enrolled = students.filter(s => s.status === 'Enrolled').length;
        const pending = students.filter(s => s.status === 'Pending').length;
        const rejected = students.filter(s => s.status === 'Rejected').length;
        const cancelled = students.filter(s => s.status === 'Cancelled').length;
        const totalActive = enrolled + pending + rejected;

        return { total: totalActive, pending, enrolled, rejected, cancelled };
    }, [students]);

    const schoolYearOptions = Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return `${y}-${y+1}`; });

    return (
        <div className="flex h-screen bg-[#020617] font-sans overflow-hidden text-slate-300">
             {/* BACKGROUND */}
             <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="Portal Background" className="absolute inset-0 w-full h-full object-cover opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-slate-950/95" />
            </div>

            {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* SIDEBAR */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center gap-4 border-b border-white/5">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#800000] to-red-900 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20 border border-white/10">
                        <img src="/1.png" className="w-8 h-8 object-contain drop-shadow-md" alt="logo"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">SRCS Admin</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enrollment System</p>
                    </div>
                </div>
                
                <div className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Main Menu</p>
                    <SidebarItem icon={Icons.dashboard} label="Overview" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setFilterStatus('All'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.folder} label="Enrollment Queue" active={activeTab === 'queue'} onClick={() => { setActiveTab('queue'); setFilterStatus('Pending'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.users} label="Student Masterlist" active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setFilterStatus('Enrolled'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.sections} label="Sections" active={activeTab === 'sections'} onClick={() => { setActiveTab('sections'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.analytics} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} />
                </div>
                
                <div className="p-6 border-t border-white/5">
                    <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-white transition-all border border-transparent hover:border-red-500/20 group">
                        <div className="group-hover:translate-x-1 transition-transform">{Icons.logout}</div> 
                        <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="md:hidden text-white" onClick={() => setIsSidebarOpen(true)}>{Icons.menu}</button>
                        
                        <div className="relative group">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(e.target.value)} 
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:border-red-500/50 transition-all outline-none cursor-pointer appearance-none pr-10 hover:bg-white/5"
                            >
                                {schoolYearOptions.map(y => <option key={y} value={y} className="bg-slate-900 text-white">SY {y}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                        </div>
                    </div>

                    {/* CENTERED SEARCH BAR (DESKTOP) */}
                    <div className="flex-1 max-w-lg mx-8 hidden md:flex justify-center">
                        <div className="relative w-full group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-400 transition-colors">{Icons.search}</div>
                            <input 
                                type="text" 
                                placeholder="SEARCH STUDENTS..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:bg-white/5 focus:border-red-500/50 transition-all outline-none uppercase placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/enrollment-landing" 
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-4 py-2.5 rounded-full transition-all border border-white/5 hover:border-white/10"
                            title="Back to Menu"
                        >
                            <div className="w-4 h-4">{Icons.arrowLeft}</div>
                            <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest">Back to Menu</span>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="mb-6 md:hidden relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{Icons.search}</div>
                        <input 
                            type="text" 
                            placeholder="SEARCH..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-red-500/50 uppercase placeholder:text-slate-600"
                        />
                    </div>

                    {/* DASHBOARD STATS */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-8 animate-fade-in-up">
                            <StatCard title="Enrolled" value={stats.enrolled} icon={Icons.check} color="bg-emerald-500" />
                            <StatCard title="Pending" value={stats.pending} icon={Icons.alert} color="bg-amber-500" />
                            <StatCard title="Rejected" value={stats.rejected} icon={Icons.x} color="bg-red-500" />
                            <StatCard title="Cancelled" value={stats.cancelled} icon={Icons.trash} color="bg-slate-500" />
                        </div>
                    )}

                    <div className="bg-slate-900/40 backdrop-blur-sm rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative">
                        {activeTab === 'sections' && <SectionManager sections={sections} onAdd={handleAddSection} onDelete={handleDeleteSection} />}
                        {activeTab === 'students' && <MasterList students={filtered} onVerify={setVerifyModal} />}
                        {activeTab === 'analytics' && <EnrollmentAnalytics students={students} />}

                        {(activeTab === 'queue' || activeTab === 'dashboard') && activeTab !== 'students' && (
                            <>
                                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#800000] to-red-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20 border border-white/10">
                                            {activeTab === 'queue' ? Icons.folder : Icons.dashboard}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-white tracking-tight uppercase">{activeTab === 'dashboard' ? 'Recent Activity' : 'Enrollment Queue'}</h2>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage Applications</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                                        {['All', 'Pending', 'Enrolled', 'Rejected', 'Cancelled'].map(status => (
                                            <button 
                                                key={status} 
                                                onClick={() => setFilterStatus(status)} 
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap 
                                                ${filterStatus === status 
                                                    ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 animate-pulse">
                                            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-700">{Icons.folder}</div>
                                            <span className="text-xs font-bold uppercase tracking-widest">No Records Found</span>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            {/* We render rows here. Assuming StudentRow component handles its own TR/DIV styling appropriate for the context */}
                                            {filtered.map(s => <StudentRow key={s.id} s={s} onVerify={setVerifyModal} onDelete={handleDelete} />)}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {verifyModal && <VerificationModal 
                student={verifyModal} 
                sections={sections} 
                onClose={() => setVerifyModal(null)} 
                onApprove={handleApprove} 
                onReject={handleReject} 
                onTransfer={(s) => setTransferModal({type:'transfer', student:s})} 
                onPromote={(s) => setTransferModal({type:'promote', student:s})}
                onUpdateList={fetchStudents} 
            />}
            {transferModal && <TransferPromoteModal type={transferModal.type} student={transferModal.student} sections={sections} onClose={() => setTransferModal(null)} onConfirm={handleTransferPromote} />}
            <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({...confirmModal, isOpen: false})} type={confirmModal.type} />
        </div>
    );
};

// Main Controller
const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => { const sub = onAuthStateChanged(auth, u => { setUser(u); setLoadingAuth(false); }); return () => sub(); }, []);
    
    if (loadingAuth) return (
        <div className="h-screen flex items-center justify-center bg-[#020617] text-red-500 text-xs font-bold animate-pulse gap-3">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            INITIALIZING SECURE CONNECTION...
        </div>
    );
    
    return user ? <DashboardLayout user={user} /> : <LoginView />;
};

export default AdminDashboard;