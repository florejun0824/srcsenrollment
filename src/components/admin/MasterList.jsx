// src/components/admin/MasterList.jsx
import React, { useMemo } from 'react';
import { Icons } from '../../utils/Icons';

const MasterList = ({ students, onVerify }) => {
    const grouped = useMemo(() => {
        const groups = {};
        students.forEach(s => {
            if (!groups[s.gradeLevel]) groups[s.gradeLevel] = {};
            const sec = s.section || 'Unassigned';
            if (!groups[s.gradeLevel][sec]) groups[s.gradeLevel][sec] = [];
            groups[s.gradeLevel][sec].push(s);
        });
        return groups;
    }, [students]);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8">
            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner">
                        <div className="opacity-50 scale-150">{Icons.folder}</div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Enrolled Students</p>
                        <p className="text-[10px] font-bold text-slate-700 mt-1">Approve students from the queue to see them here.</p>
                    </div>
                </div>
            ) : (
                Object.entries(grouped).sort().map(([grade, sections]) => (
                    <div key={grade} className="mb-10 last:mb-0">
                        {/* Sticky Grade Header */}
                        <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur-xl border-b border-white/10 pb-4 mb-6 pt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-gradient-to-b from-red-600 to-[#800000] rounded-full"></span>
                                    {grade}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                    {Object.values(sections).reduce((acc, curr) => acc + curr.length, 0)} Students
                                </span>
                            </div>
                        </div>

                        {/* Sections Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(sections).sort().map(([secName, list]) => (
                                <div key={secName} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                            {Icons.sections}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{secName}</h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{list.length} Learners</p>
                                        </div>
                                    </div>

                                    {/* Student Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {list.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => onVerify(s)} 
                                                className="group relative bg-black/20 p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all cursor-pointer flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#800000] to-red-900 text-white font-black text-xs flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                                                        {s.lastName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                                            {s.lastName}, {s.firstName}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate group-hover:text-red-400 transition-colors">
                                                            {s.lrn || 'No LRN'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-slate-600 group-hover:text-red-500 transition-colors bg-white/5 p-2 rounded-lg group-hover:bg-red-500/10">
                                                    {Icons.eye}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default MasterList;