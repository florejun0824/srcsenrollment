// src/utils/Icons.jsx
import React from 'react';
import { 
    LayoutDashboard, 
    FolderOpen, 
    UsersRound, 
    Layers, 
    BarChart3, 
    LogOut, 
    Search, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Home, 
    HeartHandshake, 
    GraduationCap, 
    Eye, 
    Download, 
    Trash2, 
    UploadCloud, 
    Plus, 
    TrendingUp, 
    ArrowRightLeft, 
    ArrowLeft, 
    Menu, 
    Filter,
    FileText,
    CalendarDays
} from 'lucide-react';

// We use a standard size class "w-5 h-5" to match your previous sizing constraints.
// Lucide icons inherit color automatically (currentColor).

export const Icons = {
    // Navigation & System
    menu: <Menu className="w-6 h-6" />,
    dashboard: <LayoutDashboard className="w-5 h-5" />,
    folder: <FolderOpen className="w-5 h-5" />,
    users: <UsersRound className="w-5 h-5" />,
    sections: <Layers className="w-5 h-5" />,
    analytics: <BarChart3 className="w-5 h-5" />,
    logout: <LogOut className="w-5 h-5" />,
    
    // Actions & Status
    search: <Search className="w-4 h-4" />,
    check: <CheckCircle2 className="w-5 h-5" />,
    x: <XCircle className="w-5 h-5" />,
    alert: <AlertTriangle className="w-5 h-5" />,
    filter: <Filter className="w-4 h-4" />,
    
    // Student & Form
    home: <Home className="w-5 h-5" />,
    family: <HeartHandshake className="w-5 h-5" />, // Represents Parents/Guardians better
    school: <GraduationCap className="w-5 h-5" />,
    calendar: <CalendarDays className="w-5 h-5" />,
    document: <FileText className="w-5 h-5" />,
    
    // Utils
    eye: <Eye className="w-4 h-4" />,
    download: <Download className="w-4 h-4" />,
    trash: <Trash2 className="w-4 h-4" />,
    upload: <UploadCloud className="w-5 h-5" />,
    plus: <Plus className="w-4 h-4" />,
    promote: <TrendingUp className="w-4 h-4" />, // Growth symbol for promotion
    transfer: <ArrowRightLeft className="w-4 h-4" />,
    arrowLeft: <ArrowLeft className="w-4 h-4" />,
    chart: <BarChart3 className="w-5 h-5" />,

    // Custom Gender Icons (Styled to match Lucide: 2px stroke, round caps)
    male: (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="14" r="5" />
            <path d="M13.5 10.5 L20 4" />
            <path d="M15 4 h5 v5" />
        </svg>
    ),
    female: (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="5" />
            <path d="M12 15 v7" />
            <path d="M9 19 h6" />
        </svg>
    )
};