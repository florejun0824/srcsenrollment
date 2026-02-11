import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    FolderOpen, 
    Users, 
    Layers, 
    BarChart3, 
    LogOut, 
    Menu, 
    Search, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Trash2,
    Wallet,
    Calendar 
} from 'lucide-react';

// IMPORT COMPONENTS
import ConfirmationModal from '../components/admin/ConfirmationModal';
import VerificationModal from '../components/admin/VerificationModal';
import TransferPromoteModal from '../components/admin/TransferPromoteModal';
import SectionManager from '../components/admin/SectionManager';
import MasterList from '../components/admin/MasterList';
import StudentRow from '../components/admin/StudentRow';
import EnrollmentAnalytics from '../components/admin/EnrollmentAnalytics'; 
import CashierPanel from '../components/admin/CashierPanel';

// --- UTILS ---
import { calculateTotalFees } from '../utils/FeeConstants'; 

// --- CONFIGURATION ---
const SCHOOL_YEARS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027", "2027-2028"];

// --- STYLES ---
const styles = `
  .neural-glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
        0 10px 40px -10px rgba(0,0,0,0.05),
        0 0 0 1px rgba(255,255,255,0.3) inset;
  }
  .sidebar-transition {
    transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.0);
    will-change: width;
  }
  .custom-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; }
`;

// --- SHARED AURORA BACKGROUND ---
const AuroraBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-cyan-300/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
    </div>
);

// --- COMPONENT: CINEMATIC ADMIN SIDEBAR (DESKTOP) ---
const AdminSidebar = ({ activeTab, onNavigate, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'queue', label: 'Enrollment Queue', icon: FolderOpen },
        { id: 'students', label: 'Masterlist', icon: Users },
        { id: 'sections', label: 'Sections', icon: Layers },
        { id: 'cashier', label: 'Cashier', icon: Wallet },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="hidden lg:block relative h-[calc(100vh-32px)] my-4 ml-4 w-[88px] shrink-0 z-50">
             <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-0 left-0 bottom-0 flex flex-col w-full hover:w-[260px] rounded-[32px] sidebar-transition group overflow-hidden neural-glass bg-white/90 border border-white/20 shadow-2xl"
            >
                {/* Logo Section */}
                <div className="h-28 flex items-center px-7 overflow-hidden whitespace-nowrap shrink-0">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-slate-100 shadow-md">
                        <img src="/1.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                        <h1 className="font-bold text-base text-slate-800 leading-tight">SRCS <span className="text-[#800000]">Admin</span></h1>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Portal</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 flex flex-col gap-2 px-4 py-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)} 
                                className={`relative flex items-center h-14 rounded-2xl group/item cursor-pointer overflow-hidden transition-all duration-200 ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                            >
                                <div className="min-w-[3.5rem] h-full flex justify-center items-center z-10">
                                    <item.icon 
                                        className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-[#800000] scale-110' : 'text-slate-400 group-hover/item:text-slate-600'}`}
                                    />
                                </div>
                                <div className="flex-1 flex items-center pr-4 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                    <span className={`text-sm font-medium tracking-wide ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeStrip"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[#800000]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 shrink-0 pb-6 space-y-2">
                     <Link to="/enrollment-landing" className="flex items-center w-full h-12 rounded-2xl hover:bg-slate-50 transition-colors group/btn overflow-hidden">
                         <div className="min-w-[3.5rem] flex justify-center items-center">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover/btn:text-slate-600" />
                         </div>
                         <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium text-slate-500">
                             Back to Menu
                         </div>
                     </Link>
                     <button onClick={onLogout} className="flex items-center w-full h-12 rounded-2xl hover:bg-red-50 transition-colors group/btn overflow-hidden">
                         <div className="min-w-[3.5rem] flex justify-center items-center">
                            <LogOut className="w-5 h-5 text-slate-400 group-hover/btn:text-red-500" />
                         </div>
                         <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium text-slate-500 group-hover/btn:text-red-600">
                             Sign Out
                         </div>
                     </button>
                </div>
            </motion.div>
        </div>
    )
};

// --- COMPONENT: STAT CARD ---
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-lg shadow-slate-200/50 flex flex-col items-start gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} opacity-20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
        
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} shadow-inner`}>
            <Icon className="w-6 h-6" />
        </div>
        
        <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{title}</p>
        </div>
    </div>
);

// --- VIEW: LOGIN ---
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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <AuroraBackground />

            <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-white animate-fade-in-up">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-white p-4 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 border border-white">
                        <img src="/1.png" alt="Official Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Portal</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Authorized Personnel Only</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Admin ID</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400" 
                            placeholder="enter@email.com"
                            required 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400" 
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-600 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:scale-95 mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
                
                <Link to="/enrollment-landing" className="flex items-center justify-center gap-2 mt-8 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Menu
                </Link>
            </div>
        </div>
    );
};

// --- LAYOUT: DASHBOARD ---
const DashboardLayout = ({ user }) => {
    // --- ROUTER HOOKS ---
    const location = useLocation();
    const navigate = useNavigate();

    // --- STATE ---
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // --- SCHOOL YEAR STATE ---
    const [selectedYear, setSelectedYear] = useState('2026-2027');
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [verifyModal, setVerifyModal] = useState(null); 
    const [transferModal, setTransferModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // --- DETERMINE ACTIVE TAB FROM URL ---
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/masterlist')) return 'students';
        if (path.includes('/queue')) return 'queue';
        if (path.includes('/sections')) return 'sections';
        if (path.includes('/cashier')) return 'cashier';
        if (path.includes('/analytics')) return 'analytics';
        return 'dashboard'; 
    };

    const activeTab = getActiveTab();

    // --- HANDLE NAVIGATION ---
    const handleNavigation = (tabId) => {
        switch(tabId) {
            case 'students': navigate('/admin/masterlist'); break;
            case 'queue': navigate('/admin/queue'); break;
            case 'sections': navigate('/admin/sections'); break;
            case 'cashier': navigate('/admin/cashier'); break;
            case 'analytics': navigate('/admin/analytics'); break;
            default: navigate('/admin/dashboard'); break;
        }
    };

    // --- FETCH DATA (DEPENDS ON SCHOOL YEAR) ---
    useEffect(() => { fetchStudents(); }, [selectedYear]);
    useEffect(() => { fetchSections(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "enrollments"), where("schoolYear", "==", selectedYear)); 
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Sort by CreatedAt (Recent first)
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

    // --- OPTIMIZED HELPERS ---
    const updateStudentLocally = (id, updates) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStudentLocally = (id) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    // --- ACTIONS ---
    const confirmAction = (title, message, action, type='danger') => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm: async () => { await action(); setConfirmModal({ ...confirmModal, isOpen: false }); } });
    };

    const handleApprove = async (id, studentID, section) => {
        confirmAction("Confirm Enrollment?", "This student will be officially enrolled.", async () => {
            await updateDoc(doc(db, "enrollments", id), { status: 'Enrolled', studentID, section, enrolledAt: new Date() });
            updateStudentLocally(id, { status: 'Enrolled', studentID, section, enrolledAt: new Date() });
            setVerifyModal(null);
        }, 'info');
    };

    const handleReject = async (id) => {
        confirmAction("Reject Application?", "This action cannot be undone.", async () => {
            await updateDoc(doc(db, "enrollments", id), { status: 'Rejected' });
            updateStudentLocally(id, { status: 'Rejected' });
            setVerifyModal(null);
        });
    };

    const handleDelete = async (student) => {
        confirmAction("Delete Record?", `Permanently delete ${student.lastName}?`, async () => {
            await deleteDoc(doc(db, "enrollments", student.id));
            removeStudentLocally(student.id);
        });
    };

    // --- MODIFIED: HANDLE TRANSFER / PROMOTE WITH BACK ACCOUNT & STATUS UPDATE ---
    const handleTransferPromote = async (student, { targetSection, targetYear, targetGrade }) => {
        const isPromo = targetYear !== student.schoolYear;
        
        confirmAction(isPromo ? "Promote Student?" : "Transfer Section?", `Confirm move to ${targetSection}?`, async () => {
            if (isPromo) {
                // --- PROMOTION LOGIC ---
                
                // 1. UPDATE OLD RECORD (Mark as Promoted)
                const currentDocRef = doc(db, "enrollments", student.id);
                await updateDoc(currentDocRef, { status: 'Promoted' });
                updateStudentLocally(student.id, { status: 'Promoted' });

                // 2. FETCH FRESH DATA TO GET ACCURATE BALANCE (FIX FOR STALE DATA)
                const freshSnap = await getDoc(currentDocRef);
                const freshData = freshSnap.data();
                const unpaidBalance = freshData.soa?.balance || 0;
                
                // 3. Calculate Fresh Fees for New Grade
                const baseFees = calculateTotalFees(targetGrade) || { 
                    tuition: 0, standard: {}, nonStandard: {}, totalAssessment: 0 
                };

                const newFeeData = {
                    ...baseFees,
                    standard: { ...baseFees.standard },
                    nonStandard: { ...baseFees.nonStandard }
                };

                // 4. Inject Back Account if exists
                if (unpaidBalance > 0) {
                    const backAccountLabel = `Back Account (SY ${student.schoolYear})`;
                    newFeeData.standard[backAccountLabel] = unpaidBalance;
                    newFeeData.totalAssessment += unpaidBalance;
                    if(newFeeData.balance !== undefined) newFeeData.balance += unpaidBalance;
                }

                // 5. Create New Record for Next Year
                const newRecord = {
                    ...freshData, // Use fresh personal info
                    schoolYear: targetYear,
                    gradeLevel: targetGrade,
                    section: targetSection,
                    status: 'Enrolled', // Visible in Next Year
                    enrolledAt: new Date(),
                    createdAt: new Date(),
                    studentType: 'Returning',
                    
                    // RESET FINANCIALS FOR NEW YEAR
                    soa: {
                        feeBreakdown: newFeeData,
                        totalAssessment: newFeeData.totalAssessment,
                        balance: newFeeData.totalAssessment, // New balance includes back account
                        paymentStatus: 'Unpaid',
                        payments: [],  
                        subsidyAmount: 0, 
                        subsidyType: null
                    }
                };
                
                // Remove ID so Firestore generates a new one
                await addDoc(collection(db, "enrollments"), newRecord);

            } else {
                // --- SECTION TRANSFER LOGIC (SAME YEAR) ---
                if (targetGrade !== student.gradeLevel) {
                    alert("Cannot change Grade Level during a Section Transfer. Use Promote instead.");
                    return;
                }

                await updateDoc(doc(db, "enrollments", student.id), { section: targetSection });
                updateStudentLocally(student.id, { section: targetSection });
            }
            setTransferModal(null);
            setVerifyModal(null);
        }, 'info');
    };

    const handleAddSection = async (name, gradeLevel) => { 
        try { 
            const docRef = await addDoc(collection(db, "sections"), { name, gradeLevel, createdAt: serverTimestamp() }); 
            setSections(prev => [...prev, { id: docRef.id, name, gradeLevel }]);
        } catch(e) { alert("Failed."); } 
    };

    const handleDeleteSection = async (section) => { 
        confirmAction("Delete Section?", `Delete ${section.name}?`, async () => { 
            await deleteDoc(doc(db, "sections", section.id)); 
            setSections(prev => prev.filter(s => s.id !== section.id));
        }); 
    };

    // --- FILTERING (QUEUE) ---
    const filteredQueue = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.lastName.toLowerCase().includes(search.toLowerCase()) || s.firstName.toLowerCase().includes(search.toLowerCase()) || (s.lrn && s.lrn.includes(search));
            
            // STRICTLY EXCLUDE ENROLLED & PROMOTED FROM QUEUE
            if (s.status === 'Enrolled' || s.status === 'Promoted') return false;

            const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [students, search, filterStatus]);

    // --- FILTERING (MASTERLIST) ---
    const masterListStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.lastName.toLowerCase().includes(search.toLowerCase()) || s.firstName.toLowerCase().includes(search.toLowerCase()) || (s.lrn && s.lrn.includes(search));
            // Show only officially enrolled or promoted
            return matchesSearch && (s.status === 'Enrolled' || s.status === 'Promoted');
        });
    }, [students, search]);

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        const enrolled = students.filter(s => s.status === 'Enrolled').length;
        const pending = students.filter(s => s.status === 'Pending').length;
        const rejected = students.filter(s => s.status === 'Rejected').length;
        const cancelled = students.filter(s => s.status === 'Cancelled').length;
        const totalActive = enrolled + pending + rejected;

        return { total: totalActive, pending, enrolled, rejected, cancelled };
    }, [students]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-600 relative">
            <style>{styles}</style>
            <AuroraBackground />

            {/* 1. CINEMATIC SIDEBAR (DESKTOP) */}
            <AdminSidebar activeTab={activeTab} onNavigate={handleNavigation} onLogout={() => signOut(auth)} />

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
                
                {/* HEADER */}
                <div className="bg-white/40 backdrop-blur-md border-b border-white/50 h-auto md:h-24 flex flex-col md:flex-row items-center justify-between px-4 py-4 md:px-8 shrink-0 shadow-sm pointer-events-none sticky top-0 z-40">
                    
                    {/* Header Title Area */}
                    <div className="flex flex-row items-center justify-between w-full md:w-auto pointer-events-auto">
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                <span>Admin</span>
                                <span className="text-[#800000]">></span>
                                <span className="text-[#800000]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none md:leading-normal">
                                Dashboard Overview
                            </h2>
                        </div>
                        
                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Bar & Year Selector Area */}
                    <div className="flex items-center gap-4 pointer-events-auto mt-4 md:mt-0 w-full md:w-auto">
                        
                        {/* --- SCHOOL YEAR DROPDOWN --- */}
                        <div className="relative group w-40 md:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-slate-400" />
                            </div>
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#800000] transition-all cursor-pointer appearance-none shadow-sm"
                            >
                                {SCHOOL_YEARS.map(year => (
                                    <option key={year} value={year}>SY {year}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-xs text-slate-400">▼</span>
                            </div>
                        </div>

                        <div className="relative group w-full md:w-64">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#800000] transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#800000] transition-all w-full shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8"> 
                    <AnimatePresence mode="wait">
                        
                        {/* DASHBOARD OVERVIEW (STATS ONLY) */}
                        {activeTab === 'dashboard' && (
                            <motion.div 
                                key="dashboard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
                            >
                                <StatCard title="Enrolled" value={stats.enrolled} icon={CheckCircle2} bgClass="bg-emerald-500" colorClass="text-white" />
                                <StatCard title="Pending" value={stats.pending} icon={AlertCircle} bgClass="bg-amber-500" colorClass="text-white" />
                                <StatCard title="Rejected" value={stats.rejected} icon={XCircle} bgClass="bg-red-500" colorClass="text-white" />
                                <StatCard title="Cancelled" value={stats.cancelled} icon={Trash2} bgClass="bg-slate-500" colorClass="text-white" />
                            </motion.div>
                        )}

                        {/* ENROLLMENT QUEUE */}
                        {activeTab === 'queue' && (
                            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-white shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
                                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                                                <FolderOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Enrollment Queue</h2>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Applications</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto max-w-full w-full sm:w-auto">
                                            {/* REMOVED 'Enrolled' from this list */}
                                            {['All', 'Pending', 'Rejected', 'Cancelled'].map(status => (
                                                <button 
                                                    key={status} 
                                                    onClick={() => setFilterStatus(status)} 
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 sm:flex-none 
                                                    ${filterStatus === status 
                                                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 animate-pulse py-10">
                                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                                            </div>
                                        ) : filteredQueue.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 py-10">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                    <FolderOpen className="w-8 h-8" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">No Records Found</span>
                                            </div>
                                        ) : (
                                            <div className="w-full">
                                                {filteredQueue.map(s => <StudentRow key={s.id} s={s} onVerify={setVerifyModal} onDelete={handleDelete} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'sections' && (
                            <motion.div key="sections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SectionManager sections={sections} onAdd={handleAddSection} onDelete={handleDeleteSection} />
                            </motion.div>
                        )}

                        {activeTab === 'students' && (
                            <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-white shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
                                    {/* USE masterListStudents HERE */}
                                    <MasterList students={masterListStudents} onVerify={setVerifyModal} onRefresh={fetchStudents} />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'cashier' && (
                            <motion.div key="cashier" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-white shadow-xl overflow-hidden h-[600px] flex flex-col relative">
                                    <CashierPanel />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && (
                            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <EnrollmentAnalytics students={students} />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* 3. MOBILE BOTTOM NAV (Glass Dock) */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[380px]"> 
                <div className="neural-glass rounded-full px-4 py-3 flex items-center justify-between shadow-2xl mx-4">
                    <button onClick={() => handleNavigation('dashboard')} className={`p-2 transition-colors ${activeTab === 'dashboard' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <LayoutDashboard className="w-6 h-6" fill={activeTab === 'dashboard' ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleNavigation('queue')} className={`p-2 transition-colors ${activeTab === 'queue' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <FolderOpen className="w-6 h-6" fill={activeTab === 'queue' ? "currentColor" : "none"} />
                    </button>
                     <button onClick={() => handleNavigation('students')} className={`p-2 transition-colors ${activeTab === 'students' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <Users className="w-6 h-6" fill={activeTab === 'students' ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleNavigation('sections')} className={`p-2 transition-colors ${activeTab === 'sections' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <Layers className="w-6 h-6" fill={activeTab === 'sections' ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleNavigation('cashier')} className={`p-2 transition-colors ${activeTab === 'cashier' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <Wallet className="w-6 h-6" fill={activeTab === 'cashier' ? "currentColor" : "none"} />
                    </button>
                     <button onClick={() => handleNavigation('analytics')} className={`p-2 transition-colors ${activeTab === 'analytics' ? 'text-[#800000]' : 'text-slate-400'}`}>
                        <BarChart3 className="w-6 h-6" fill={activeTab === 'analytics' ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            {/* MOBILE SIDE MENU OVERLAY */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white z-[70] p-6 shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-lg font-black text-slate-900">Menu</span>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full"><XCircle className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-2">
                                <Link to="/enrollment-landing" className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 text-slate-700 font-bold">
                                    <ArrowLeft className="w-5 h-5" /> Back to Menu
                                </Link>
                                <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 font-bold">
                                    <LogOut className="w-5 h-5" /> Log Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600 text-xs font-bold gap-4">
             <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="uppercase tracking-widest">Initializing Secure Connection...</span>
        </div>
    );
    
    return user ? <DashboardLayout user={user} /> : <LoginView />;
};

export default AdminDashboard;