// src/components/admin/StudentRow.jsx
import React from 'react';
import { Icons } from '../../utils/Icons';

const StatusBadge = ({ status }) => {
    const styles = {
        'Enrolled': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        'Archived': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        'Cancelled': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    
    // Default to pending style if status is unknown
    const activeStyle = styles[status] || styles['Pending'];

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${activeStyle} backdrop-blur-md`}>
            {status || 'Pending'}
        </span>
    );
};

// Use React.memo to prevent re-renders if props don't change
const StudentRow = React.memo(({ s, onVerify, onDelete }) => (
    <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group min-w-[800px]">
        
        {/* Name & LRN */}
        <div className="col-span-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] to-red-900 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-red-900/20 border border-white/10 shrink-0">
                {s.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-none truncate group-hover:text-red-400 transition-colors">
                    {s.lastName}, {s.firstName}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-1.5 tracking-wider uppercase">
                    {s.lrn || <span className="text-slate-600">No LRN</span>}
                </p>
            </div>
        </div>

        {/* Grade & Type */}
        <div className="col-span-3">
            <p className="text-xs font-bold text-slate-300 truncate">{s.gradeLevel}</p>
            <span className="inline-block mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                {s.studentType}
            </span>
        </div>

        {/* Status */}
        <div className="col-span-2">
            <StatusBadge status={s.status} />
        </div>

        {/* Date */}
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
        </div>

        {/* Actions */}
        <div className="col-span-2 flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform translate-x-2 md:group-hover:translate-x-0">
            <button 
                onClick={() => onVerify(s)} 
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all hover:border-white/20 uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
                View
            </button>
            <button 
                onClick={() => onDelete(s)} 
                className="p-2 border border-white/10 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                title="Delete Record"
            >
                {Icons.trash}
            </button>
        </div>
    </div>
));

export default StudentRow;