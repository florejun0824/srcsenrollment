// src/components/admin/StudentRow.jsx
import React from 'react';
// REMOVED: import { PDFDownloadLink } from '@react-pdf/renderer';
// REMOVED: import EnrollmentPDF from '../EnrollmentPDF';
import { Icons } from '../../utils/Icons';

const StatusBadge = ({ status }) => {
    const styles = {
        'Enrolled': 'bg-green-100 text-green-700 border-green-200',
        'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Rejected': 'bg-red-100 text-red-700 border-red-200',
        'Archived': 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[status] || styles['Pending']}`}>{status || 'Pending'}</span>;
};

// Use React.memo to prevent re-renders if props don't change
const StudentRow = React.memo(({ s, onVerify, onDelete }) => (
    <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors group min-w-[800px]">
        <div className="col-span-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-200 shrink-0">
                {s.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-none truncate">{s.lastName}, {s.firstName}</p>
                <p className="text-[10px] text-gray-400 mt-1">{s.lrn || 'No LRN'}</p>
            </div>
        </div>
        <div className="col-span-3">
            <p className="text-xs font-bold text-gray-700 truncate">{s.gradeLevel}</p>
            <p className="text-[10px] text-gray-400 truncate">{s.studentType}</p>
        </div>
        <div className="col-span-2"><StatusBadge status={s.status} /></div>
        <div className="col-span-2 text-xs font-medium text-gray-500">
            {s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {/* The VIEW button opens the modal, where we will put the PDF download */}
            <button onClick={() => onVerify(s)} className="px-3 py-1.5 bg-[#800000] text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-[#600000] transition-colors whitespace-nowrap">VIEW</button>
            <button onClick={() => onDelete(s)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors">{Icons.trash}</button>
        </div>
    </div>
));

export default StudentRow;