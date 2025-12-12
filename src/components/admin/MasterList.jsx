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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar p-6">
            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <span className="text-4xl opacity-20 mb-2">📂</span>
                    <p className="text-xs font-bold">NO ENROLLED STUDENTS</p>
                </div>
            ) : (
                Object.entries(grouped).sort().map(([grade, sections]) => (
                    <div key={grade} className="mb-8">
                        <h3 className="text-lg font-black text-[#800000] uppercase tracking-tight mb-4 border-b border-gray-100 pb-2 sticky top-0 bg-white z-10">{grade}</h3>
                        {Object.entries(sections).sort().map(([secName, list]) => (
                            <div key={secName} className="mb-6 ml-2">
                                <h4 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> {secName} 
                                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{list.length}</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {list.map(s => (
                                        <div key={s.id} onClick={() => onVerify(s)} className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md hover:border-[#800000]/30 transition-all cursor-pointer group flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-white text-[#800000] font-bold text-xs flex items-center justify-center border border-gray-200 shrink-0">{s.lastName.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">{s.lastName}, {s.firstName}</p>
                                                    <p className="text-[9px] text-gray-400">{s.lrn || 'No LRN'}</p>
                                                </div>
                                            </div>
                                            <div className="text-gray-300 group-hover:text-[#800000]">{Icons.eye}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
};

export default MasterList;