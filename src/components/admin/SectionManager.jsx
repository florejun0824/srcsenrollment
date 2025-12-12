import React, { useState } from 'react';
import { Icons } from '../../utils/Icons';

const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

const SectionManager = ({ sections, onAdd, onDelete }) => {
    const [newSection, setNewSection] = useState('');
    const [targetGrade, setTargetGrade] = useState(GRADE_LEVELS[0]);

    const handleAdd = () => { if(newSection.trim()){ onAdd(newSection, targetGrade); setNewSection(''); } };

    return (
        <div className="p-6 md:p-8 max-w-4xl">
            <h2 className="text-xl font-black text-gray-900 mb-6">Section Management</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Grade Level</label>
                        <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#800000]">
                            {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Section Name</label>
                        <div className="flex gap-2">
                            <input type="text" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. St. Matthew" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#800000]"/>
                            <button onClick={handleAdd} className="bg-[#800000] text-white px-6 rounded-xl font-bold text-sm shadow-lg hover:bg-[#600000] transition-all">Create</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-6">
                {GRADE_LEVELS.map(grade => {
                    const gradeSections = sections.filter(s => s.gradeLevel === grade);
                    if (gradeSections.length === 0) return null;
                    return (
                        <div key={grade}>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">{grade}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {gradeSections.map(sec => (
                                    <div key={sec.id} className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                                        <span className="font-bold text-gray-800 text-sm">{sec.name}</span>
                                        <button onClick={() => onDelete(sec)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">{Icons.trash}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SectionManager;