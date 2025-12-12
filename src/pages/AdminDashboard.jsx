import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

// IMPORT COMPONENTS
import { Icons } from '../utils/Icons';
import ConfirmationModal from '../components/admin/ConfirmationModal';
import VerificationModal from '../components/admin/VerificationModal';
import TransferPromoteModal from '../components/admin/TransferPromoteModal';
import SectionManager from '../components/admin/SectionManager';
import MasterList from '../components/admin/MasterList';
import StudentRow from '../components/admin/StudentRow';
import EnrollmentAnalytics from '../components/admin/EnrollmentAnalytics'; // NEW

// ... (Keep existing SidebarItem, StatCard, LoginView code exactly as is) ...
const SidebarItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-[#800000] text-white shadow-lg shadow-red-900/20' : 'text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900'}`}>
        <div className={`transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#800000]'}`}>{icon}</div>
        <span className="text-sm font-bold tracking-wide">{label}</span>
    </button>
);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left min-w-[100px]">
        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${color} shrink-0`}>{icon}</div>
        <div><p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">{title}</p><h3 className="text-lg md:text-2xl font-black text-gray-900 leading-none mt-1">{value}</h3></div>
    </div>
);

const LoginView = () => {
    // ... (Your existing LoginView code) ...
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleLogin = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError('Access Denied.'); } setLoading(false); };
    
    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#800000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/50 backdrop-blur-xl">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#800000] to-red-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-red-900/20"><img src="/logo.png" className="w-12 h-12 object-contain" alt="Logo"/></div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Admin Access Only</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" placeholder="ADMIN ID" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#800000] transition-all" required />
                    <input type="password" placeholder="PASSWORD" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#800000] transition-all" required />
                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">{error}</div>}
                    <button type="submit" disabled={loading} className="w-full bg-[#800000] hover:bg-[#600000] text-white font-bold text-sm py-4 rounded-xl shadow-xl shadow-red-900/20 transition-all hover:-translate-y-1">{loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}</button>
                </form>
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

    // --- STATS CALCULATION (MODIFIED) ---
    const stats = useMemo(() => {
        const enrolled = students.filter(s => s.status === 'Enrolled').length;
        const pending = students.filter(s => s.status === 'Pending').length;
        const rejected = students.filter(s => s.status === 'Rejected').length;
        const cancelled = students.filter(s => s.status === 'Cancelled').length;
        const totalActive = enrolled + pending + rejected;

        return {
            total: totalActive, // Changed to totalActive
            pending: pending,
            enrolled: enrolled,
            rejected: rejected, // Added Rejected count
            cancelled: cancelled // Added Cancelled count
        };
    }, [students]);

    const schoolYearOptions = Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return `${y}-${y+1}`; });

    return (
        <div className="flex h-screen bg-[#F5F5F7] font-sans overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* SIDEBAR */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-100"><img src="/logo.png" className="w-8 h-8 object-contain" alt="logo"/></div>
                    <div><h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">SRCS</h1><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enrollment System</p></div>
                </div>
                <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Menu</p>
                    <SidebarItem icon={Icons.dashboard} label="Overview" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setFilterStatus('All'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.folder} label="Enrollment Queue" active={activeTab === 'queue'} onClick={() => { setActiveTab('queue'); setFilterStatus('Pending'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.users} label="Student Masterlist" active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setFilterStatus('Enrolled'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.sections} label="Sections" active={activeTab === 'sections'} onClick={() => { setActiveTab('sections'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Icons.analytics} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} />
                </div>
                <div className="p-4 border-t border-gray-100"><button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:font-bold transition-all">{Icons.logout} <span className="text-sm font-medium">Sign Out</span></button></div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(true)}>{Icons.menu}</button>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-[#800000] focus:ring-2 focus:ring-[#800000]/10 transition-all outline-none cursor-pointer">
                            {schoolYearOptions.map(y => <option key={y} value={y}>SY {y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-full max-w-xs hidden md:block">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</div>
                            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-[#800000]/10 transition-all outline-none"/>
                        </div>
                        <button className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">{Icons.bell}{stats.pending > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mb-4 md:hidden relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</div>
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#800000]"/>
                    </div>

                    {/* DASHBOARD STATS (MODIFIED TO SHOW ENROLLED, PENDING, REJECTED, CANCELLED) */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-6 mb-8">
                            <StatCard title="Enrolled" value={stats.enrolled} icon={Icons.check} color="bg-green-500" />
                            <StatCard title="Pending" value={stats.pending} icon={Icons.alert} color="bg-yellow-500" />
                            <StatCard title="Rejected" value={stats.rejected} icon={Icons.x} color="bg-red-500" />
                            <StatCard title="Cancelled" value={stats.cancelled} icon={Icons.x} color="bg-gray-500" />
                        </div>
                    )}

                    {activeTab === 'sections' && <SectionManager sections={sections} onAdd={handleAddSection} onDelete={handleDeleteSection} />}
                    {activeTab === 'students' && <MasterList students={filtered} onVerify={setVerifyModal} />}
                    {activeTab === 'analytics' && <EnrollmentAnalytics students={students} />}

                    {(activeTab === 'queue' || activeTab === 'dashboard') && activeTab !== 'students' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Queue</h2>
                                {/* FILTER BUTTONS (MODIFIED TO INCLUDE CANCELLED) */}
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                    {['All', 'Pending', 'Enrolled', 'Rejected', 'Cancelled'].map(status => (
                                        <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === status ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{status}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loading ? <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">Loading...</div> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-400">NO RECORDS</div> : <div className="block md:table w-full">{filtered.map(s => <StudentRow key={s.id} s={s} onVerify={setVerifyModal} onDelete={handleDelete} />)}</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

					{verifyModal && <VerificationModal 
					    student={verifyModal} 
					    sections={sections} 
					    onClose={() => setVerifyModal(null)} 
					    onApprove={handleApprove} 
					    onReject={handleReject} 
					    onTransfer={(s) => setTransferModal({type:'transfer', student:s})} 
					    onPromote={(s) => setTransferModal({type:'promote', student:s})}
					    onUpdateList={fetchStudents} // <--- ADD THIS
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
    if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7] text-gray-400 text-xs font-bold animate-pulse">LOADING...</div>;
    return user ? <DashboardLayout user={user} /> : <LoginView />;
};

export default AdminDashboard;