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
    male: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
    female: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 10v1m0 5v1m-7-5h1m10 0h1M5 12h1m10 0h1m-5 4a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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

// --- NEW/MODIFIED COMPONENTS FOR LAST SCHOOL ANALYTICS ---

// Mobile Card View (UPDATED FOR COMPACTNESS)
const LastSchoolCard = ({ school, isAllGradesView }) => {
    // Determine the data to display on the card based on the view mode
    let breakdownContent;

    if (isAllGradesView) {
        breakdownContent = (
            <div className="mt-3 border-t border-gray-100 pt-2">
                <div className="flex justify-around items-center">
                    <span className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-blue-600 uppercase">Male</span>
                        <span className="text-lg font-black text-blue-800">{school.overallMale || 0}</span>
                    </span>
                    <span className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-pink-600 uppercase">Female</span>
                        <span className="text-lg font-black text-pink-800">{school.overallFemale || 0}</span>
                    </span>
                </div>
            </div>
        );
    } else {
        // Specific grade view: Male, Female only
        breakdownContent = (
            <div className="mt-3 flex justify-around border-t border-gray-100 pt-2">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-blue-600 uppercase">Male</span>
                    <span className="text-lg font-black text-blue-800">{school.male || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-pink-600 uppercase">Female</span>
                    <span className="text-lg font-black text-pink-800">{school.female || 0}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg shadow-red-50/30 hover:border-[#800000] transition-all duration-200">
            <div className="flex justify-between items-start">
                {/* Reduced font size from text-sm to text-xs */}
                <h5 className="text-xs font-black text-gray-900 leading-tight pr-4">{school.name}</h5>
                <div className="text-right">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Total</span>
                    {/* Reduced font size from text-2xl to text-xl */}
                    <span className="text-xl font-black text-[#800000]">{school.total}</span>
                </div>
            </div>
            {breakdownContent}
        </div>
    );
};

// Desktop Table View
const LastSchoolTable = ({ data, selectedGrade }) => {
    const sortedSchools = useMemo(() => {
        return Object.values(data).sort((a, b) => b.total - a.total);
    }, [data]);

    const isAllGradesView = selectedGrade === 'All';

    const allGrades = useMemo(() => {
        if (!isAllGradesView) return [];
        const grades = new Set();
        sortedSchools.forEach(school => {
            // Need to dive deeper since the structure is now { grades: { 'Grade X': { male, female, total } } }
            if (school.grades) {
                Object.keys(school.grades).forEach(grade => grades.add(grade));
            }
        });
        return GRADE_LEVELS.filter(g => grades.has(g));
    }, [sortedSchools, isAllGradesView]);
    
    const sortedGrades = allGrades.sort((a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b));

    const getShortGradeName = (grade) => grade.replace('Pre-Kindergarten', 'PK').replace('Kinder', 'K').replace('Grade', 'G').replace(' (SHS)', '');

    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-1/3 min-w-[150px]">School Name</th>
                        
                        {isAllGradesView ? (
                            // --- VIEW 1: ALL GRADES (Only Total Male/Female) ---
                            <>
                                <th className="px-2 py-3 text-center text-[9px] font-black text-blue-600 uppercase tracking-wider whitespace-nowrap">Male</th>
                                <th className="px-2 py-3 text-center text-[9px] font-black text-pink-600 uppercase tracking-wider whitespace-nowrap">Female</th>
                            </>
                        ) : (
                            // --- VIEW 2: SPECIFIC GRADE (Breakdown by Grade) ---
                            <>
                                <th className="px-2 py-3 text-center text-[9px] font-black text-blue-600 uppercase tracking-wider whitespace-nowrap">Male</th>
                                <th className="px-2 py-3 text-center text-[9px] font-black text-pink-600 uppercase tracking-wider whitespace-nowrap">Female</th>
                            </>
                        )}

                        <th className="px-3 py-3 text-center text-[10px] font-black text-[#800000] uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[70px]">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {sortedSchools.map((school, index) => (
                        <tr key={index} className="hover:bg-red-50/20 transition-colors">
                            <td className="px-3 py-3 whitespace-nowrap text-xs font-bold text-gray-800 sticky left-0 bg-white z-10 shadow-sm">{school.name}</td>
                            
                            {isAllGradesView ? (
                                // --- RENDER VIEW 1 DATA ---
                                <>
                                    {/* Total Male/Female columns */}
                                    <td className={`px-2 py-3 whitespace-nowrap text-center text-sm font-black ${school.overallMale > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {school.overallMale > 0 ? school.overallMale : '-'}
                                    </td>
                                    <td className={`px-2 py-3 whitespace-nowrap text-center text-sm font-black ${school.overallFemale > 0 ? 'text-pink-600' : 'text-gray-300'}`}>
                                        {school.overallFemale > 0 ? school.overallFemale : '-'}
                                    </td>
                                </>
                            ) : (
                                // --- RENDER VIEW 2 DATA ---
                                <>
                                    <td className={`px-2 py-3 whitespace-nowrap text-center text-sm font-bold ${school.male > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {school.male > 0 ? school.male : '-'}
                                    </td>
                                    <td className={`px-2 py-3 whitespace-nowrap text-center text-sm font-bold ${school.female > 0 ? 'text-pink-600' : 'text-gray-300'}`}>
                                        {school.female > 0 ? school.female : '-'}
                                    </td>
                                </>
                            )}
                            
                            <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-black text-[#800000] sticky right-0 bg-white z-10 shadow-sm">{school.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Last School Analytics wrapper component for responsive rendering
const LastSchoolAnalytics = ({ data, selectedGrade }) => {
    const sortedSchools = useMemo(() => {
        return Object.values(data).sort((a, b) => b.total - a.total);
    }, [data]);

    if (sortedSchools.length === 0) {
        return <div className="p-4 text-center text-gray-400 text-xs">No previous school data available.</div>;
    }

    const isAllGradesView = selectedGrade === 'All';

    return (
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2 px-2 md:px-0">
                Last School Attended
                <span className="text-gray-500 font-medium ml-2">({isAllGradesView ? 'All Active Grades' : selectedGrade})</span>
            </h4>
            
            {/* MOBILE CARD VIEW (Hidden md: for medium and up screens) */}
            <div className="grid grid-cols-1 gap-4 p-2 md:hidden">
                {sortedSchools.map((school, index) => (
                    <LastSchoolCard 
                        key={index} 
                        school={school} 
                        isAllGradesView={isAllGradesView} 
                    />
                ))}
            </div>

            {/* DESKTOP TABLE VIEW (Shown md: for medium and up screens) */}
            <div className="hidden md:block">
                <LastSchoolTable data={data} selectedGrade={selectedGrade} />
            </div>
        </div>
    );
};


const EnrollmentAnalytics = ({ students }) => {
    const [selectedGrade, setSelectedGrade] = useState('All');

    // --- DATA CALCULATION ---
    const stats = useMemo(() => {
        const allStatsStudents = students; // Base data for all stats

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
        const byLastSchool = {}; // Stores the raw aggregated data

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
                const schoolNameKey = s.lastSchoolName.trim().toUpperCase();
                
                if (!byLastSchool[schoolNameKey]) {
                    byLastSchool[schoolNameKey] = {
                        name: s.lastSchoolName.trim(), 
                        total: 0,
                        overallMale: 0, 
                        overallFemale: 0, 
                        grades: {} // { 'Grade X': { male, female, total } }
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
                        // Only keep the school if it has enrollment for the selected grade
                        if (gradeData && gradeData.total > 0) {
                            return [key, {
                                name: school.name,
                                total: gradeData.total, // Total for this specific grade
                                male: gradeData.male,
                                female: gradeData.female
                            }];
                        }
                        return [key, null];
                    })
                    .filter(([, value]) => value !== null)
            );
        } else {
             // For 'All' view, we keep all data for the table/cards
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                <StatCard 
                    label="Total Active" 
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
                <StatCard 
                    label="Rejected Applications" 
                    value={stats.rejected} 
                    color="bg-red-500" 
                    subtext={`${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%`} 
                />
            </div>

            {/* ROW FOR CANCELLED ENROLLMENTS */}
            {selectedGrade === 'All' && stats.cancelled > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                     <StatCard 
                        label="Cancelled Enrollments" 
                        value={stats.cancelled} 
                        color="bg-gray-500" 
                        subtext=""
                    />
                </div>
            )}
            
            {/* GENDER DISTRIBUTION */}
            <div className="mb-6 md:mb-8">
                <GenderBar male={stats.male} female={stats.female} />
            </div>

            {/* CONDITIONAL: LAST SCHOOL ATTENDED ANALYTICS (MOVED UP) */}
            {Object.keys(stats.byLastSchool).length > 0 && (
                <div className="mb-8">
                    <LastSchoolAnalytics data={stats.byLastSchool} selectedGrade={selectedGrade} />
                </div>
            )}

            {/* CONDITIONAL: GRADE DISTRIBUTION CHART (MOVED DOWN) */}
            {selectedGrade === 'All' && (
                <>
                    <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Enrollment by Grade Level (Active Records)</h4>
                        
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
                </>
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