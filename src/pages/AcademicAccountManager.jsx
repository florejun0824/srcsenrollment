// src/pages/AcademicAccountManager.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
    Search, UserPlus, FileUp, Download, LogOut, Trash2, Edit, Users, 
    Eye, EyeOff, CheckSquare, Square, ChevronLeft, ChevronRight, 
    ArrowLeft, ShieldCheck, RefreshCw, Layers, GraduationCap, Archive, TrendingUp
} from 'lucide-react';

import AddAccountModal from '../components/admin/AddAccountModal';
import EditAccountModal from '../components/admin/EditAccountModal';
import GenerateAccountsModal from '../components/admin/GenerateAccountsModal';
import DownloadAccountsModal from '../components/admin/DownloadAccountsModal';
import PromoteAccountModal from '../components/admin/PromoteAccountModal';

// --- AURORA BACKGROUND ---
const AuroraBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-cyan-300/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
    </div>
);

// --- AVATAR COLOR GENERATOR ---
const getAvatarColor = (name) => {
    const colors = [
        "from-indigo-500 to-purple-600 shadow-indigo-200",
        "from-emerald-500 to-teal-600 shadow-emerald-200",
        "from-rose-500 to-pink-600 shadow-rose-200",
        "from-amber-500 to-orange-600 shadow-amber-200",
        "from-cyan-500 to-blue-600 shadow-cyan-200",
        "from-violet-500 to-fuchsia-600 shadow-violet-200",
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
};

const CACHE_KEY = 'srcs_cached_accounts';

const AcademicAccountManager = () => {
    // --- STATE ---
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    // View & Filters
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Selection & Privacy
    const [selectedIds, setSelectedIds] = useState([]);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null); 

    const navigate = useNavigate();

    // --- INITIALIZATION ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) fetchAccounts(); 
            else setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- OPTIMIZED DATA FETCHING ---
    const fetchAccounts = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (!forceRefresh && cachedData) {
                setAccounts(JSON.parse(cachedData));
                setLoading(false);
                return;
            }

            const q = query(collection(db, "student_accounts"), orderBy("studentName"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(),
                gradeLevel: d.data().gradeLevel || 'Unassigned',
                section: d.data().section || 'Unassigned',
                isArchived: d.data().isArchived || false
            }));
            
            setAccounts(data);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
            setSelectedIds([]); 
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
        setLoading(false);
    };

    const updateLocalData = (newData) => {
        setAccounts(newData);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    };

    // --- FILTERING LOGIC ---
    const visibleAccounts = useMemo(() => {
        return accounts.filter(acc => 
            activeTab === 'archived' ? acc.isArchived === true : !acc.isArchived
        );
    }, [accounts, activeTab]);

    const uniqueGrades = useMemo(() => {
        const grades = [...new Set(visibleAccounts.map(a => a.gradeLevel))];
        return grades.sort();
    }, [visibleAccounts]);

    const uniqueSections = useMemo(() => {
        let relevant = visibleAccounts;
        if (selectedGrade) relevant = relevant.filter(a => a.gradeLevel === selectedGrade);
        const sections = [...new Set(relevant.map(a => a.section))];
        return sections.sort();
    }, [visibleAccounts, selectedGrade]);

    const filteredAccounts = useMemo(() => {
        return visibleAccounts.filter(acc => {
            const matchesSearch = 
                acc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                acc.username.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesGrade = selectedGrade ? acc.gradeLevel === selectedGrade : true;
            const matchesSection = selectedSection ? acc.section === selectedSection : true;

            return matchesSearch && matchesGrade && matchesSection;
        });
    }, [visibleAccounts, searchQuery, selectedGrade, selectedSection]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedGrade, selectedSection, activeTab]);

    // --- PAGINATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

    // --- HANDLERS ---
    const handleLogout = async () => {
        await signOut(auth);
        sessionStorage.removeItem(CACHE_KEY); 
        navigate('/student-portal');
    };

    const togglePassword = (id) => setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

    const handleSelectAll = useCallback(() => {
        const currentIds = filteredAccounts.map(acc => acc.id);
        const allSelected = currentIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
        }
    }, [filteredAccounts, selectedIds]);

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Permanently delete account for ${name}?`)) return;
        const newData = accounts.filter(acc => acc.id !== id);
        updateLocalData(newData);
        try { await deleteDoc(doc(db, "student_accounts", id)); } 
        catch (error) { fetchAccounts(true); }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Delete ${selectedIds.length} selected accounts?`)) return;
        setIsDeleting(true);
        try {
            const batch = writeBatch(db);
            selectedIds.forEach(id => batch.delete(doc(db, "student_accounts", id)));
            await batch.commit();
            const newData = accounts.filter(acc => !selectedIds.includes(acc.id));
            updateLocalData(newData);
            setSelectedIds([]);
        } catch (error) { fetchAccounts(true); }
        setIsDeleting(false);
    };

    if (!user && !loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600 text-xs font-bold gap-4">
            <ShieldCheck className="w-10 h-10 animate-bounce" />
            <span className="uppercase tracking-widest">Access Restricted</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 font-sans relative overflow-x-hidden pb-24">
            <AuroraBackground />

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
                {/* HEADER */}
                <header className="flex flex-col gap-6 mb-6">
                    {/* Title & Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="w-full md:w-auto">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <span className="p-2 md:p-3 bg-indigo-600 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl shadow-indigo-200 text-white">
                                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                                </span>
                                User Manager
                            </h1>
                            {/* TABS */}
                            <div className="flex items-center gap-2 mt-4 overflow-x-auto hide-scrollbar">
                                <button 
                                    onClick={() => setActiveTab('active')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                                >
                                    Active
                                </button>
                                <button 
                                    onClick={() => setActiveTab('archived')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'archived' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Archive className="w-3 h-3" /> Archived
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative group w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </header>

                {/* FILTERS & ACTION BAR */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    <div className="flex gap-2 flex-1 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                        <div className="relative min-w-[120px]">
                            <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSection(''); }} className="w-full pl-4 pr-8 py-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wide text-slate-600 appearance-none cursor-pointer outline-none transition-all shadow-sm">
                                <option value="">Grades</option>
                                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="relative min-w-[120px]">
                            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full pl-4 pr-8 py-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wide text-slate-600 appearance-none cursor-pointer outline-none transition-all shadow-sm">
                                <option value="">Sections</option>
                                {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {(selectedGrade || selectedSection) && (
                            <button onClick={() => { setSelectedGrade(''); setSelectedSection(''); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 text-xs font-bold transition-all whitespace-nowrap">Clear</button>
                        )}
                    </div>

                    {/* ACTIONS GROUP */}
                    <div className="flex gap-2 items-center justify-end">
                        {activeTab === 'active' && (
                            <button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none justify-center bg-white hover:bg-indigo-50 px-4 py-2.5 rounded-full border border-slate-200 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 active:scale-95">
                                <UserPlus className="w-4 h-4 text-indigo-600" />
                                <span className="text-slate-700 font-bold text-[10px] uppercase">Add</span>
                            </button>
                        )}
                        <button onClick={() => setIsGenerateOpen(true)} className="flex-1 md:flex-none justify-center bg-white hover:bg-emerald-50 px-4 py-2.5 rounded-full border border-slate-200 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2 active:scale-95">
                            <FileUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-slate-700 font-bold text-[10px] uppercase">Import</span>
                        </button>
                        <button onClick={() => setIsDownloadOpen(true)} className="flex-1 md:flex-none justify-center bg-white hover:bg-blue-50 px-4 py-2.5 rounded-full border border-slate-200 hover:border-blue-200 transition-all shadow-sm flex items-center gap-2 active:scale-95">
                            <Download className="w-4 h-4 text-blue-600" />
                            <span className="text-slate-700 font-bold text-[10px] uppercase">Export</span>
                        </button>
                    </div>
                </div>

                {/* MOBILE SELECT ALL BAR */}
                <div className="md:hidden flex items-center justify-between px-2 mb-2">
                    <button onClick={handleSelectAll} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {selectedIds.length > 0 && selectedIds.length === filteredAccounts.length ? 
                            <CheckSquare className="w-4 h-4 text-indigo-600" /> : 
                            <Square className="w-4 h-4" />
                        }
                        {selectedIds.length === filteredAccounts.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{filteredAccounts.length} Students</span>
                </div>

                {/* BULK SELECTION FLOATING BAR (OPTIMIZED) */}
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out w-[90%] max-w-md ${selectedIds.length > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-between border border-white/10 ring-1 ring-black/20">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedIds([])} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                                <span className="text-[10px]">✕</span>
                            </button>
                            <span className="font-bold text-xs uppercase tracking-widest text-slate-300">
                                <span className="text-white text-sm mr-1">{selectedIds.length}</span>
                            </span>
                        </div>
                        
                        <div className="flex gap-2">
                            {/* Promote Button (Label always visible now) */}
                            {activeTab === 'active' && (
                                <button 
                                    onClick={() => setIsPromoteOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                                >
                                    <TrendingUp className="w-3 h-3" /> 
                                    <span>Promote</span>
                                </button>
                            )}

                            <button 
                                onClick={handleDeleteSelected}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5 transition-all shadow-lg shadow-red-900/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN DATA DISPLAY */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-xl min-h-[400px] flex flex-col relative">
                    
                    {(loading || isDeleting) && (
                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300">
                            <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Processing...</span>
                            </div>
                        </div>
                    )}

                    {!loading && filteredAccounts.length === 0 && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                {activeTab === 'archived' ? <Archive className="w-8 h-8 opacity-40" /> : <Users className="w-8 h-8 opacity-40" />}
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest">No {activeTab} accounts found</p>
                        </div>
                    )}

                    {/* OPTIMIZED MOBILE CARD VIEW */}
                    <div className="md:hidden p-3 space-y-2">
                        {currentItems.map((acc) => {
                            const isSelected = selectedIds.includes(acc.id);
                            return (
                                <div key={acc.id} className={`bg-white rounded-2xl p-3 border shadow-sm transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/10 bg-indigo-50/10' : 'border-slate-100'}`}>
                                    {/* Top Row: Selection, Info, Actions */}
                                    <div className="flex items-center gap-3">
                                        <div onClick={() => handleSelectOne(acc.id)} className="cursor-pointer">
                                            {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                                        </div>
                                        
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(acc.studentName)} flex items-center justify-center text-[10px] text-white font-black shadow-sm shrink-0`}>
                                            {acc.studentName.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{acc.studentName}</h3>
                                            <div className="flex gap-1 mt-0.5">
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{acc.gradeLevel}</span>
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{acc.section}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => setEditingAccount(acc)} className="p-1.5 bg-white text-slate-400 rounded-lg border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 shadow-sm">
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDelete(acc.id, acc.studentName)} className="p-1.5 bg-white text-slate-400 rounded-lg border border-slate-200 hover:border-red-200 hover:text-red-600 shadow-sm">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Password */}
                                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pass:</span>
                                            <span className={`font-mono text-xs ${visiblePasswords[acc.id] ? 'text-slate-700 font-bold' : 'text-slate-300'}`}>
                                                {visiblePasswords[acc.id] ? acc.password : '••••••••'}
                                            </span>
                                        </div>
                                        <button onClick={() => togglePassword(acc.id)} className="p-1">
                                            {visiblePasswords[acc.id] ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
                                    <th className="p-6 w-16 text-center">
                                        <button onClick={handleSelectAll} className="hover:text-indigo-600 transition-colors">
                                            {selectedIds.length > 0 && selectedIds.length === filteredAccounts.length ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </th>
                                    <th className="p-6">Student Info</th>
                                    <th className="p-6">Grouping</th>
                                    <th className="p-6">Credentials</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.map((acc) => {
                                    const isSelected = selectedIds.includes(acc.id);
                                    return (
                                        <tr key={acc.id} className={`transition-colors duration-200 group ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/50'}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleSelectOne(acc.id)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                                                    {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(acc.studentName)} flex items-center justify-center text-xs text-white font-black shadow-sm ring-2 ring-white`}>
                                                        {acc.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{acc.studentName}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">{acc.gradeLevel}</span>
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">{acc.section}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24">
                                                        <span className={`font-mono text-xs transition-all ${visiblePasswords[acc.id] ? 'text-slate-800 font-bold' : 'text-slate-300 tracking-[0.2em]'}`}>
                                                            {visiblePasswords[acc.id] ? acc.password : '••••••••'}
                                                        </span>
                                                    </div>
                                                    <button onClick={() => togglePassword(acc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                                        {visiblePasswords[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingAccount(acc)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(acc.id, acc.studentName)} className="p-2 hover:bg-white border border-transparent hover:border-red-100 hover:shadow-sm rounded-lg text-slate-400 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 bg-white/50 flex items-center justify-between sticky bottom-0 backdrop-blur-md">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm disabled:shadow-none">
                                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Page <span className="text-slate-900 text-sm mx-1">{currentPage}</span> of {totalPages}
                            </span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm disabled:shadow-none">
                                <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {isAddOpen && <AddAccountModal onClose={() => setIsAddOpen(false)} onSuccess={() => fetchAccounts(true)} />}
            {isGenerateOpen && <GenerateAccountsModal onClose={() => setIsGenerateOpen(false)} onSuccess={() => fetchAccounts(true)} />}
            {isDownloadOpen && <DownloadAccountsModal accounts={filteredAccounts} onClose={() => setIsDownloadOpen(false)} />}
            {isPromoteOpen && <PromoteAccountModal selectedIds={selectedIds} allAccounts={accounts} onClose={() => setIsPromoteOpen(false)} onSuccess={() => fetchAccounts(true)} />}
            {editingAccount && <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSuccess={() => fetchAccounts(true)} />}
        </div>
    );
};

export default AcademicAccountManager;