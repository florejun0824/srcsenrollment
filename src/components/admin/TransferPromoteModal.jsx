import React, { useState, useEffect } from 'react';

const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

const getNextGrade = (current) => {
    const idx = GRADE_LEVELS.indexOf(current);
    return (idx !== -1 && idx < GRADE_LEVELS.length - 1) ? GRADE_LEVELS[idx + 1] : 'Graduated';
};

const getNextSchoolYear = (currentSY) => {
    const startYear = parseInt(currentSY.split('-')[0]);
    return `${startYear + 1}-${startYear + 2}`;
};

const TransferPromoteModal = ({ type, student, sections, onClose, onConfirm }) => {
    const [targetSection, setTargetSection] = useState('');
    const [targetYear, setTargetYear] = useState('');
    const [targetGrade, setTargetGrade] = useState('');

    useEffect(() => {
        if (type === 'promote') {
            setTargetGrade(getNextGrade(student.gradeLevel));
            setTargetYear(getNextSchoolYear(student.schoolYear));
        } else {
            setTargetGrade(student.gradeLevel);
            setTargetYear(student.schoolYear);
        }
    }, [type, student]);

    const validSections = sections.filter(sec => sec.gradeLevel === targetGrade);

    const handleConfirm = () => {
        if (type === 'transfer' && !targetSection) return alert("Select a section");
        onConfirm(student, { targetSection, targetYear, targetGrade });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-lg font-black text-gray-900 mb-4">{type === 'promote' ? 'Promote Student' : 'Transfer Section'}</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                        <p className="text-gray-500 text-xs uppercase font-bold">Target School Year</p>
                        <p className="font-bold text-gray-900">{targetYear}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                        <p className="text-gray-500 text-xs uppercase font-bold">Target Grade Level</p>
                        <p className="font-bold text-[#800000]">{targetGrade}</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Assign New Section</label>
                        <select 
                            value={targetSection} 
                            onChange={(e) => setTargetSection(e.target.value)} 
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-[#800000]"
                        >
                            <option value="">-- {validSections.length ? 'Select Section' : 'No Sections Available'} --</option>
                            {validSections.map(sec => <option key={sec.id} value={sec.name}>{sec.name}</option>)}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1 italic">Only showing sections for {targetGrade}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50">CANCEL</button>
                    <button onClick={handleConfirm} className="flex-1 py-2 rounded-lg bg-[#800000] text-white text-xs font-bold shadow-lg hover:bg-[#600000]">CONFIRM</button>
                </div>
            </div>
        </div>
    );
};

export default TransferPromoteModal;