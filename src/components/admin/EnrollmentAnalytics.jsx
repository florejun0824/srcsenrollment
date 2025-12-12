// src/components/admin/EnrollmentAnalytics.jsx
import React, { useState, useMemo } from 'react';

const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

const Icons = {
    chart: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
    filter: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
};

const StatCard = ({ label, value, subtext, color = "bg-blue-500" }) => (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
        <div className="flex flex-row md:flex-col justify-between items-center md:items-start">
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">{value}</h3>
            </div>
            {/* Visual Indicator for Mobile */}
            <div className={`md:hidden w-8 h-8 rounded-full ${color} opacity-20`}></div>
        </div>
        
        {subtext && (
            <div className="mt-3 h-1 w-full rounded-full bg-gray-100 overflow-hidden hidden md:block">
                <div className={`h-full ${color}`} style={{ width: subtext }}></div>
            </div>
        )}
    </div>
);

const GenderBar = ({ male, female }) => {
    const total = male + female;
    const malePerc = total ? Math.round((male / total) * 100) : 0;
    const femalePerc = total ? Math.round((female / total) * 100) : 0;

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Gender Distribution</h4>
            
            {/* The Bar */}
            <div className="flex h-6 md:h-8 w-full rounded-full overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                <div className="bg-blue-500 h-full flex items-center justify-center transition-all duration-500 relative group" style={{ width: `${malePerc}%` }}>
                    {malePerc > 10 && <span className="text-[9px] font-bold text-white absolute">M: {malePerc}%</span>}
                </div>
                <div className="bg-pink-500 h-full flex items-center justify-center transition-all duration-500 relative group" style={{ width: `${femalePerc}%` }}>
                    {femalePerc > 10 && <span className="text-[9px] font-bold text-white absolute">F: {femalePerc}%</span>}
                </div>
            </div>

            {/* Legend / Counters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-full sm:w-auto">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-bold">Male: {male}</span>
                </div>
                <div className="flex items-center gap-2 text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg w-full sm:w-auto">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span className="font-bold">Female: {female}</span>
                </div>
            </div>
        </div>
    );
};

const EnrollmentAnalytics = ({ students }) => {
    const [selectedGrade, setSelectedGrade] = useState('All');

    // --- DATA CALCULATION ---
    const stats = useMemo(() => {
        const filteredStudents = selectedGrade === 'All' 
            ? students 
            : students.filter(s => s.gradeLevel === selectedGrade);

        const data = {
            total: filteredStudents.length,
            enrolled: 0,
            pending: 0,
            rejected: 0,
            male: 0,
            female: 0,
            byGrade: {} 
        };

        filteredStudents.forEach(s => {
            if (s.status === 'Enrolled') data.enrolled++;
            else if (s.status === 'Pending') data.pending++;
            else if (s.status === 'Rejected') data.rejected++;

            if (s.sex === 'Male') data.male++;
            else if (s.sex === 'Female') data.female++;

            if (selectedGrade === 'All') {
                if (!data.byGrade[s.gradeLevel]) data.byGrade[s.gradeLevel] = 0;
                data.byGrade[s.gradeLevel]++;
            }
        });

        return data;
    }, [students, selectedGrade]);

    // Calculate max value for chart scaling
    const maxGradeCount = useMemo(() => {
        if (selectedGrade !== 'All') return 0;
        const counts = Object.values(stats.byGrade);
        return Math.max(...counts, 1);
    }, [stats, selectedGrade]);

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            
            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                        {Icons.chart} Analytics
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">
                        {selectedGrade === 'All' ? 'School-Wide Overview' : `${selectedGrade} Report`}
                    </p>
                </div>
                
                <div className="relative w-full md:w-auto">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.filter}</div>
                    <select 
                        value={selectedGrade} 
                        onChange={(e) => setSelectedGrade(e.target.value)} 
                        className="w-full md:w-auto bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl pl-10 pr-8 py-3 outline-none focus:ring-2 focus:ring-[#800000]/10 focus:border-[#800000] shadow-sm cursor-pointer appearance-none"
                    >
                        <option value="All">All Grade Levels</option>
                        <option disabled>──────────</option>
                        {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
            </div>

            {/* KEY METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-6">
                <StatCard 
                    label="Total Applications" 
                    value={stats.total} 
                    color="bg-gray-800" 
                    subtext="100%" 
                />
                <StatCard 
                    label="Officially Enrolled" 
                    value={stats.enrolled} 
                    color="bg-green-500" 
                    subtext={`${stats.total ? Math.round((stats.enrolled / stats.total) * 100) : 0}%`} 
                />
                <StatCard 
                    label="Pending Review" 
                    value={stats.pending} 
                    color="bg-yellow-500" 
                    subtext={`${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%`} 
                />
            </div>

            {/* GENDER DISTRIBUTION */}
            <div className="mb-6 md:mb-8">
                <GenderBar male={stats.male} female={stats.female} />
            </div>

            {/* CONDITIONAL: GRADE DISTRIBUTION CHART */}
            {selectedGrade === 'All' && (
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Enrollment by Grade Level</h4>
                    
                    {/* SCROLLABLE CHART CONTAINER */}
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex items-end gap-3 md:gap-4 h-56 md:h-64 min-w-[600px] px-2">
                            {GRADE_LEVELS.map(grade => {
                                const count = stats.byGrade[grade] || 0;
                                const heightPerc = (count / maxGradeCount) * 100;
                                const shortName = grade.replace('Pre-Kindergarten', 'PK').replace('Kinder', 'K').replace('Grade', 'G').replace(' (SHS)', '');

                                return (
                                    <div key={grade} className="flex-1 min-w-[30px] flex flex-col justify-end items-center group relative">
                                        
                                        {/* Tooltip for Mobile Tap */}
                                        <div className="mb-2 text-[10px] font-bold text-white bg-gray-800 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-10 whitespace-nowrap">
                                            {count} Students
                                        </div>

                                        {/* The Bar */}
                                        <div 
                                            className="w-full bg-[#800000]/10 rounded-t-lg relative group-hover:bg-[#800000]/20 transition-all duration-500"
                                            style={{ height: `${heightPerc}%`, minHeight: count > 0 ? '6px' : '4px' }}
                                        >
                                            {count > 0 && (
                                                <div className="absolute top-0 w-full h-1.5 bg-[#800000] rounded-t-lg"></div>
                                            )}
                                        </div>
                                        
                                        {/* Grade Label */}
                                        <div className="mt-3 text-[9px] font-bold text-gray-400 uppercase text-center truncate w-full">
                                            {shortName}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {stats.total === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm">No data available for this selection.</p>
                </div>
            )}
        </div>
    );
};

export default EnrollmentAnalytics;