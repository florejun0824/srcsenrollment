// src/components/admin/DownloadAccountsModal.jsx
import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

const DownloadAccountsModal = ({ accounts, onClose }) => {
    const handleDownload = () => {
        // Map the data to a clean format for Excel
        const data = accounts.map(acc => ({
            "Student Name": acc.studentName,
            "Username": acc.username,
            "Password": acc.password
        }));
        
        // Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Accounts");
        
        // Trigger download
        XLSX.writeFile(wb, "Student_Accounts_Credentials.xlsx");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    <Download className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-white uppercase mb-2">Export Accounts</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Download {accounts ? accounts.length : 0} student credentials to an Excel file.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all"
                    >
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadAccountsModal;