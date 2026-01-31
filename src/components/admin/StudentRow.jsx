// src/components/admin/StudentRow.jsx
import React from 'react';
import { Icons } from '../../utils/Icons';

const StatusBadge = ({ status }) => {
    // UPDATED: Light Theme Styles (Pastel backgrounds, darker text)
    const styles = {
        'Enrolled': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100',
        'Pending': 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100',
        'Rejected': 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100',
        'Archived': 'bg-slate-100 text-slate-500 border-slate-200',
        'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200'
    };
    
    // Default to pending style if status is unknown
    const activeStyle = styles[status] || styles['Pending'];

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${activeStyle}`}>
            {status || 'Pending'}
        </span>
    );
};

// Use React.memo to prevent re-renders if props don't change
const StudentRow = React.memo(({ s, onVerify, onDelete }) => (
    // UPDATED: Container styles (White background, light borders)
    <div className="grid grid-cols-12 px-6 py-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors group min-w-[800px]">
        
        {/* Name & LRN */}
        <div className="col-span-4 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] to-red-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-red-200 border border-white shrink-0">
                {s.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
                {/* Name - Dark Slate Text */}
                <p className="text-sm font-bold text-slate-800 leading-none truncate group-hover:text-[#800000] transition-colors">
                    {s.lastName}, {s.firstName}
                </p>
                {/* LRN - Light Slate Text */}
                <p className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wider uppercase">
                    {s.lrn || <span className="text-slate-300 italic">No LRN</span>}
                </p>
            </div>
        </div>

        {/* Grade & Type */}
        <div className="col-span-3">
            <p className="text-xs font-bold text-slate-600 truncate">{s.gradeLevel}</p>
            {/* Tag - Light Gray Background */}
            <span className="inline-block mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {s.studentType}
            </span>
        </div>

        {/* Status */}
        <div className="col-span-2">
            <StatusBadge status={s.status} />
        </div>

        {/* Date */}
        <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
        </div>

        {/* Actions */}
        <div className="col-span-2 flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform translate-x-2 md:group-hover:translate-x-0">
            <button 
                onClick={() => onVerify(s)} 
                className="px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-[10px] font-bold rounded-lg shadow-sm transition-all uppercase tracking-wider"
            >
                View
            </button>
            <button 
                onClick={() => onDelete(s)} 
                className="p-2 border border-slate-200 bg-white rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                title="Delete Record"
            >
                {Icons.trash}
            </button>
        </div>
    </div>
));

export default StudentRow;