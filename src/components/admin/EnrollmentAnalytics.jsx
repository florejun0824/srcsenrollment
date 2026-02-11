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
    school: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
};

// --- STAT CARD COMPONENT (Light Theme) ---
const StatCard = ({ label, value, subtext, color = "bg-blue-500", glowColor = "bg-blue-500" }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        {/* Glow Effect - Subtle on light mode */}
        <div className={`absolute top-0 right-0 w-24 h-24 ${glowColor} blur-[60px] opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none group-hover:opacity-20 transition-opacity`}></div>
        
        <div className="flex flex-row md:flex-col justify-between items-center md:items-start relative z-10">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800">{value}</h3>
            </div>
            {/* Visual Indicator for Mobile */}
            <div className={`md:hidden w-2 h-2 rounded-full ${color}`}></div>
        </div>
        
        {subtext && (
            <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden hidden md:block">
                <div className={`h-full ${color}`} style={{ width: subtext }}></div>
            </div>
        )}
    </div>
);

// --- GENDER BAR COMPONENT (Light Theme) ---
const GenderBar = ({ male, female }) => {
    const total = male + female;
    const malePerc = total ? Math.round((male / total) * 100) : 0;
    const femalePerc = total ? Math.round((female / total) * 100) : 0;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Gender Distribution</h4>
            
            {/* The Bar */}
            <div className="flex h-8 w-full rounded-xl overflow-hidden mb-5 bg-slate-100 border border-slate-200">
                <div className="bg-blue-500 h-full flex items-center justify-center transition-all duration-500 relative group" style={{ width: `${malePerc}%` }}>
                    {malePerc > 10 && <span className="text-[9px] font-black text-white absolute uppercase tracking-wider">M: {malePerc}%</span>}
                </div>
                <div className="bg-pink-500 h-full flex items-center justify-center transition-all duration-500 relative group" style={{ width: `${femalePerc}%` }}>
                    {femalePerc > 10 && <span className="text-[9px] font-black text-white absolute uppercase tracking-wider">F: {femalePerc}%</span>}
                </div>
            </div>

            {/* Legend / Counters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 w-full sm:w-auto">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-blue-600 text-xs uppercase tracking-wide">Male: {male}</span>
                </div>
                <div className="flex items-center gap-3 bg-pink-50 px-4 py-2 rounded-xl border border-pink-100 w-full sm:w-auto">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span className="font-bold text-pink-600 text-xs uppercase tracking-wide">Female: {female}</span>
                </div>
            </div>
        </div>
    );
};

// --- TABLE COMPONENTS (Light Theme) ---

const LastSchoolCard = ({ school, isAllGradesView }) => {
    return (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mb-3">
            <div className="flex justify-between items-start mb-4">
                <h5 className="text-xs font-black text-slate-700 leading-snug uppercase tracking-wide pr-4">{school.name}</h5>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-right mb-0.5">Total</span>
                    <span className="text-lg font-black text-slate-800 block text-right leading-none">{school.total}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-xl p-2 border border-blue-100 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-1">Male</span>
                    <span className="text-sm font-black text-slate-700">
                        {isAllGradesView ? school.overallMale : school.male || 0}
                    </span>
                </div>
                <div className="bg-pink-50 rounded-xl p-2 border border-pink-100 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-pink-500 uppercase tracking-wider mb-1">Female</span>
                    <span className="text-sm font-black text-slate-700">
                        {isAllGradesView ? school.overallFemale : school.female || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};

const LastSchoolTable = ({ data, selectedGrade }) => {
    const sortedSchools = useMemo(() => {
        return Object.values(data).sort((a, b) => b.total - a.total);
    }, [data]);

    const isAllGradesView = selectedGrade === 'All';

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 z-20 w-1/3 min-w-[200px] bg-slate-50 border-b border-slate-200 shadow-[5px_0_15px_rgba(0,0,0,0.02)]">
                                School Name
                            </th>
                            
                            {isAllGradesView ? (
                                <>
                                    <th className="px-4 py-5 text-center text-[9px] font-bold text-blue-500/70 uppercase tracking-widest w-[100px] bg-slate-50/50 border-b border-slate-200">Male</th>
                                    <th className="px-4 py-5 text-center text-[9px] font-bold text-pink-500/70 uppercase tracking-widest w-[100px] bg-slate-50/50 border-b border-slate-200">Female</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-4 py-5 text-center text-[9px] font-bold text-blue-500/70 uppercase tracking-widest w-[100px] bg-slate-50/50 border-b border-slate-200">Male</th>
                                    <th className="px-4 py-5 text-center text-[9px] font-bold text-pink-500/70 uppercase tracking-widest w-[100px] bg-slate-50/50 border-b border-slate-200">Female</th>
                                </>
                            )}
                            
                            <th className="px-6 py-5 text-center text-[10px] font-black text-red-500 uppercase tracking-widest sticky right-0 z-20 w-[100px] bg-slate-50 border-b border-slate-200 shadow-[-5px_0_15px_rgba(0,0,0,0.02)]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedSchools.map((school, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wide sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-100 shadow-[5px_0_15px_rgba(0,0,0,0.02)] truncate max-w-[250px]">
                                    {school.name}
                                </td>
                                
                                {isAllGradesView ? (
                                    <>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block w-8 py-1 rounded text-[10px] font-bold ${school.overallMale > 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                                                {school.overallMale > 0 ? school.overallMale : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block w-8 py-1 rounded text-[10px] font-bold ${school.overallFemale > 0 ? 'bg-pink-50 text-pink-600' : 'text-slate-300'}`}>
                                                {school.overallFemale > 0 ? school.overallFemale : '-'}
                                            </span>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block w-8 py-1 rounded text-[10px] font-bold ${school.male > 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                                                {school.male > 0 ? school.male : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block w-8 py-1 rounded text-[10px] font-bold ${school.female > 0 ? 'bg-pink-50 text-pink-600' : 'text-slate-300'}`}>
                                                {school.female > 0 ? school.female : '-'}
                                            </span>
                                        </td>
                                    </>
                                )}
                                
                                <td className="px-6 py-4 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-l border-slate-100 shadow-[-5px_0_15px_rgba(0,0,0,0.02)]">
                                    <span className="text-sm font-black text-slate-800">{school.total}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Main EnrollmentAnalytics Component
const EnrollmentAnalytics = ({ students }) => {
    const [selectedGrade, setSelectedGrade] = useState('All');

    // --- DATA CALCULATION ---
    const stats = useMemo(() => {
        const allStatsStudents = students; 

        const filteredStudents = selectedGrade === 'All' 
            ? allStatsStudents 
            : allStatsStudents.filter(s => s.gradeLevel === selectedGrade); 

        let enrolled = 0;
        let pending = 0;
        let rejected = 0;
        let cancelled = 0; 
        let male = 0;
        let female = 0;
        const byGrade = {}; 
        const byLastSchool = {}; 

        filteredStudents.forEach(s => { 
            if (s.status === 'Enrolled') enrolled++;
            else if (s.status === 'Pending') pending++;
            else if (s.status === 'Rejected') rejected++;
            else if (s.status === 'Cancelled') cancelled++;

            if (s.sex === 'Male') male++;
            else if (s.sex === 'Female') female++;

            if (selectedGrade === 'All' && s.status !== 'Cancelled') {
                if (!byGrade[s.gradeLevel]) byGrade[s.gradeLevel] = 0;
                byGrade[s.gradeLevel]++;
            }
        });
        
        // --- LOGIC FOR LAST SCHOOL ATTENDED ---
        const activeStudents = allStatsStudents.filter(s => s.status === 'Enrolled' || s.status === 'Pending');

        activeStudents.forEach(s => {
            if (s.lastSchoolName && s.lastSchoolName.trim()) {
                // --- NEW NORMALIZATION LOGIC ---
                const rawName = s.lastSchoolName.trim();
                const upperName = rawName.toUpperCase();
                
                let schoolNameKey = upperName;
                let displayName = rawName;

                // Check for variations and standardize
                if (
                    upperName === "CELMS" || 
                    (upperName.includes("LIMSIACO") && upperName.includes("ELISEO"))
                ) {
                    schoolNameKey = "CONG.ELISEO P. LIMSIACO SR. MEMORIAL SCHOOL";
                    displayName = "CONG.ELISEO P. LIMSIACO SR. MEMORIAL SCHOOL";
                }
                // ---------------------------------
                
                if (!byLastSchool[schoolNameKey]) {
                    byLastSchool[schoolNameKey] = {
                        name: displayName, // Use standardized name
                        total: 0,
                        overallMale: 0, 
                        overallFemale: 0, 
                        grades: {} 
                    };
                }
                
                byLastSchool[schoolNameKey].total++; 
                
                const gradeLevel = s.gradeLevel;
                if (!byLastSchool[schoolNameKey].grades[gradeLevel]) {
                    byLastSchool[schoolNameKey].grades[gradeLevel] = { male: 0, female: 0, total: 0 };
                }

                byLastSchool[schoolNameKey].grades[gradeLevel].total++;
                if (s.sex === 'Male') {
                    byLastSchool[schoolNameKey].grades[gradeLevel].male++;
                    byLastSchool[schoolNameKey].overallMale++; 
                } else if (s.sex === 'Female') {
                    byLastSchool[schoolNameKey].grades[gradeLevel].female++;
                    byLastSchool[schoolNameKey].overallFemale++; 
                }
            }
        });
        
        // --- Filter/Transform byLastSchool based on selectedGrade ---
        let finalByLastSchool = byLastSchool;

        if (selectedGrade !== 'All') {
            finalByLastSchool = Object.fromEntries(
                Object.entries(byLastSchool)
                    .map(([key, school]) => {
                        const gradeData = school.grades[selectedGrade];
                        if (gradeData && gradeData.total > 0) {
                            return [key, {
                                name: school.name,
                                total: gradeData.total, 
                                male: gradeData.male,
                                female: gradeData.female
                            }];
                        }
                        return [key, null];
                    })
                    .filter(([, value]) => value !== null)
            );
        } else {
             finalByLastSchool = Object.fromEntries(
                Object.entries(byLastSchool)
                    .map(([key, school]) => {
                        return [key, {
                            name: school.name,
                            total: school.total,
                            overallMale: school.overallMale,
                            overallFemale: school.overallFemale,
                            grades: school.grades 
                        }];
                    })
            );
        }

        const totalActive = enrolled + pending + rejected; 

        return {
            total: totalActive, 
            enrolled,
            pending,
            rejected,
            cancelled, 
            male,
            female,
            byGrade,
            byLastSchool: finalByLastSchool
        };
    }, [students, selectedGrade]);

    const maxGradeCount = useMemo(() => {
        if (selectedGrade !== 'All') return 0;
        const counts = Object.values(stats.byGrade);
        return Math.max(...counts, 1);
    }, [stats, selectedGrade]);

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            
            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <span className="w-10 h-10 bg-gradient-to-br from-[#800000] to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 border border-white text-white">
                            {Icons.chart}
                        </span> 
                        Enrollment Analytics
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] ml-1">
                        {selectedGrade === 'All' ? 'School-Wide Overview' : `${selectedGrade} Report`}
                    </p>
                </div>
                
                <div className="relative w-full md:w-auto group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">{Icons.filter}</div>
                    <select 
                        value={selectedGrade} 
                        onChange={(e) => setSelectedGrade(e.target.value)} 
                        className="w-full md:w-auto bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-12 pr-10 py-3.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-sm cursor-pointer appearance-none hover:bg-slate-50 transition-all uppercase tracking-wide"
                    >
                        <option value="All" className="text-slate-700">All Grade Levels</option>
                        <option disabled className="text-slate-300">──────────</option>
                        {GRADE_LEVELS.map(g => <option key={g} value={g} className="text-slate-700">{g}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
            </div>

            {/* KEY METRICS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 animate-fade-in-up">
                <StatCard 
                    label="Total Active" 
                    value={stats.total} 
                    color="bg-slate-400" 
                    glowColor="bg-slate-400"
                    subtext="100%" 
                />
                <StatCard 
                    label="Enrolled" 
                    value={stats.enrolled} 
                    color="bg-emerald-500" 
                    glowColor="bg-emerald-200"
                    subtext={`${stats.total ? Math.round((stats.enrolled / stats.total) * 100) : 0}%`} 
                />
                <StatCard 
                    label="Pending" 
                    value={stats.pending} 
                    color="bg-amber-500" 
                    glowColor="bg-amber-200"
                    subtext={`${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%`} 
                />
                <StatCard 
                    label="Rejected" 
                    value={stats.rejected} 
                    color="bg-red-500" 
                    glowColor="bg-red-200"
                    subtext={`${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%`} 
                />
            </div>

            {/* CANCELLED ROW */}
            {selectedGrade === 'All' && stats.cancelled > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                     <StatCard 
                        label="Cancelled" 
                        value={stats.cancelled} 
                        color="bg-slate-400" 
                        glowColor="bg-slate-200"
                        subtext=""
                    />
                </div>
            )}
            
            {/* GENDER DISTRIBUTION */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <GenderBar male={stats.male} female={stats.female} />
            </div>

            {/* LAST SCHOOL ATTENDED ANALYTICS (MOVED UP) */}
            {Object.keys(stats.byLastSchool).length > 0 && (
                <div className="bg-white p-2 md:p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="px-4 md:px-2 pt-4 pb-6 flex items-center justify-between border-b border-slate-100 mb-6">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            {Icons.school} Last School Attended
                        </h4>
                        <span className="bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider">
                            {selectedGrade === 'All' ? 'All Levels' : selectedGrade}
                        </span>
                    </div>
                    
                    {/* MOBILE CARD VIEW */}
                    <div className="grid grid-cols-1 gap-4 p-2 md:hidden">
                        {Object.values(stats.byLastSchool)
                            .sort((a, b) => b.total - a.total)
                            .map((school, index) => (
                                <LastSchoolCard 
                                    key={index} 
                                    school={school} 
                                    isAllGradesView={selectedGrade === 'All'} 
                                />
                        ))}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block">
                        <LastSchoolTable data={stats.byLastSchool} selectedGrade={selectedGrade} />
                    </div>
                </div>
            )}

            {/* GRADE DISTRIBUTION CHART (MOVED DOWN) */}
            {selectedGrade === 'All' && (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4 flex items-center gap-2">
                        {Icons.chart} Enrollment by Grade Level (Active)
                    </h4>
                    
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex items-end gap-3 md:gap-4 h-64 min-w-[600px] px-2">
                            {GRADE_LEVELS.map(grade => {
                                const count = stats.byGrade[grade] || 0;
                                const heightPerc = (count / maxGradeCount) * 100;
                                const shortName = grade.replace('Pre-Kindergarten', 'PK').replace('Kinder', 'K').replace('Grade', 'G').replace(' (SHS)', '');

                                return (
                                    <div key={grade} className="flex-1 min-w-[30px] flex flex-col justify-end items-center group relative">
                                        
                                        {/* Tooltip */}
                                        <div className="mb-3 text-[10px] font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all absolute -top-10 z-10 whitespace-nowrap">
                                            {count} Students
                                        </div>

                                        {/* The Bar - Light Theme Gradient */}
                                        <div 
                                            className="w-full bg-gradient-to-t from-red-100 to-red-300 rounded-t-lg relative group-hover:to-red-400 transition-all duration-500 border-t border-x border-red-200"
                                            style={{ height: `${heightPerc}%`, minHeight: count > 0 ? '6px' : '4px' }}
                                        >
                                            {count > 0 && (
                                                <div className="absolute top-0 w-full h-1 bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
                                            )}
                                        </div>
                                        
                                        {/* Grade Label */}
                                        <div className="mt-4 text-[9px] font-bold text-slate-400 uppercase text-center truncate w-full group-hover:text-red-600 transition-colors">
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
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No data available for this selection.</p>
                </div>
            )}
        </div>
    );
};

export default EnrollmentAnalytics;