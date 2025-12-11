// src/pages/EnrollmentForm.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom'; 

// --- MODERN UI COMPONENTS ---

const InputGroup = ({ label, name, value, onChange, type="text", required=false, placeholder="", width="col-span-1", disabled=false }) => (
  <div className={`flex flex-col ${width}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      required={required && !disabled} 
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] focus:bg-white block p-3 transition-all duration-200 outline-none ${disabled ? 'bg-gray-200 cursor-not-allowed opacity-60 text-gray-400' : ''}`}
    />
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6 mt-2">
    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#800000] text-lg">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
  </div>
);

const RadioButton = ({ name, value, label, checked, onChange }) => (
  <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all duration-200 ${checked ? 'border-[#800000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-[#800000]' : 'border-gray-400'}`}>
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#800000]" />}
    </div>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
    <span className={`text-sm font-bold uppercase ${checked ? 'text-[#800000]' : 'text-gray-600'}`}>{label}</span>
  </label>
);

const EnrollmentForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- CONFIGURATION ---
  const currentYear = new Date().getFullYear();
  const schoolYearOptions = Array.from({ length: 10 }, (_, i) => {
    const start = currentYear + 1 + i; 
    return `${start}-${start + 1}`;
  });

  // --- STATE MANAGEMENT ---
  const [data, setData] = useState({
    schoolYear: schoolYearOptions[0], 
    gradeLevel: '', 
    studentType: 'New', // Added Student Type
    lrnStatus: 'No LRN', 
    psaCert: '', lrn: '', 
    lastName: '', firstName: '', middleName: '', extension: '',
    dob: '', sex: 'Male', age: '', motherTongue: '',
    isIP: false, ipCommunity: '',
    addressStreet: '', addressBarangay: '', addressCity: '', addressProvince: '', addressZip: '',
    fatherName: '', motherName: '', guardianName: '', 
    contactNumber1: '', contactNumber2: '',
    signatory: 'Father',
    lastGradeLevel: '', lastSchoolYear: '', lastSchoolName: '', lastSchoolAddress: '', // Removed ID from here if not needed or added below
    semester: '', track: '', strand: ''
  });

  // --- LOGIC: SHS TRACK/STRAND ---
  const startYear = parseInt(data.schoolYear.split('-')[0]); 
  const isG11 = data.gradeLevel === 'Grade 11 (SHS)';
  const isG12 = data.gradeLevel === 'Grade 12 (SHS)';

  let isTrackDisabled = false;
  if (startYear === 2026) {
     if (isG11) isTrackDisabled = true; 
     if (isG12) isTrackDisabled = false; 
  } else if (startYear >= 2027) {
     isTrackDisabled = true; 
  }
  const showStrand = !isTrackDisabled && isG12 && startYear === 2026;

  // --- LOGIC: AGE WARNING ---
  let ageWarning = null;
  const cutoffYear = startYear; // e.g., 2026
  
  if (data.gradeLevel === 'Pre-Kindergarten 1') {
    ageWarning = `Learner must be 3 years old on or before October 31, ${cutoffYear}.`;
  } else if (data.gradeLevel === 'Pre-Kindergarten 2') {
    ageWarning = `Learner must be 4 years old on or before October 31, ${cutoffYear}.`;
  } else if (data.gradeLevel === 'Kinder') {
    ageWarning = `Learner must be 5 years old on or before October 31, ${cutoffYear}.`;
  }

  // --- LOGIC: SHOW PREVIOUS SCHOOL INFO ---
  // Show if specific grades OR if Transferee/Returning
  const targetGradesForPrevSchool = ['Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 'Grade 7', 'Grade 11 (SHS)'];
  const showPrevSchool = targetGradesForPrevSchool.includes(data.gradeLevel) || data.studentType === 'Transferee' || data.studentType === 'Returning';

  useEffect(() => {
    if (isTrackDisabled) {
      setData(prev => ({ ...prev, track: '', strand: '' }));
    }
    if (!showStrand && data.strand !== '') {
      setData(prev => ({ ...prev, strand: '' }));
    }
  }, [isTrackDisabled, showStrand, data.strand]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    if (name === 'isIP') {
        setData(prev => ({ ...prev, isIP: value === 'true', ipCommunity: value === 'false' ? '' : prev.ipCommunity }));
    } else {
        setData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "enrollments"), { ...data, createdAt: new Date() });
      setSubmitted(true);
      window.scrollTo(0,0);
    } catch (error) {
      console.error(error);
      alert("Error submitting form. Please check your connection.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-8 border-[#800000]">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✓</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3">Pre-Enrollment Successful!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">The student data has been officially recorded in the system.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-[#800000] text-white font-bold py-4 rounded-xl hover:bg-[#600000] transition-colors shadow-lg">
            Enroll Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* HEADER AREA */}
        <div className="bg-[#800000] py-10 px-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFD700] rounded-full -translate-x-10 -translate-y-10 opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#FFD700] rounded-full translate-x-10 translate-y-10 opacity-20"></div>
          
          <Link to="/admin" className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 group">
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider group-hover:text-white">Admin Portal</span>
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white text-xs group-hover:bg-white/30">→</div>
          </Link>

          <div className="relative z-10 flex flex-col items-center">
            <img src="/1.png" alt="San Ramon Logo" className="w-24 h-24 mb-4 drop-shadow-lg object-contain" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">SAN RAMON CATHOLIC SCHOOL</h1>
            <p className="text-[#FFD700] mt-2 font-bold uppercase tracking-widest text-sm">Official Enrollment System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          
          {/* 1. ENROLLMENT STATUS & GRADE LEVEL */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* School Year */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">School Year</label>
                <div className="relative">
                  <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none">
                    {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                </div>
              </div>

              {/* Grade Level */}
              <div className="col-span-1 lg:col-span-1">
                 <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Grade Level to Enroll</label>
                 <div className="relative">
                   <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-gray-800 bg-white border border-[#FFD700] rounded-lg p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none">
                      <option value="">-- Select Grade --</option>
                      <option value="Pre-Kindergarten 1">Pre-Kindergarten 1</option>
                      <option value="Pre-Kindergarten 2">Pre-Kindergarten 2</option>
                      <option value="Kinder">Kinder</option>
                      {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(g => (<option key={g} value={g}>{g}</option>))}
                      <option value="Grade 11 (SHS)">Grade 11 (SHS)</option>
                      <option value="Grade 12 (SHS)">Grade 12 (SHS)</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                 </div>
                 {/* AGE WARNING DISPLAY */}
                 {ageWarning && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-[10px] text-yellow-800 font-bold flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{ageWarning}</span>
                    </div>
                 )}
              </div>

              {/* Student Type */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Student Type</label>
                <div className="space-y-2">
                   {['New', 'Old', 'Transferee', 'Returning'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                         <input type="radio" name="studentType" value={type} checked={data.studentType === type} onChange={handleChange} className="accent-[#800000] w-4 h-4" />
                         <span className="text-xs font-bold text-gray-700">{type}</span>
                      </label>
                   ))}
                </div>
              </div>

              {/* LRN Status */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">LRN Availability</label>
                <div className="space-y-2">
                   {['With LRN', 'No LRN'].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                         <input type="radio" name="lrnStatus" value={status} checked={data.lrnStatus === status} onChange={handleChange} className="accent-[#800000] w-4 h-4" />
                         <span className="text-xs font-bold text-gray-700">{status}</span>
                      </label>
                   ))}
                </div>
              </div>

            </div>
          </div>

          {/* 2. STUDENT INFO */}
          <section>
            <SectionHeader title="Student Information" icon="👤" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
              <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" />
              <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required />
              <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required />
              <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} />
              <InputGroup label="Extension (Jr.)" name="extension" value={data.extension} onChange={handleChange} />
              <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
              <div className="md:col-span-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 block">Sex</label>
                 <div className="flex gap-3">
                    <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                    <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                 </div>
              </div>
              <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
              <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
              <div className="md:col-span-4 bg-gray-50 rounded-xl p-6 border border-gray-200 mt-2">
                 <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <span className="text-sm font-bold text-gray-700 uppercase">Belonging to any Indigenous People (IP) Community?</span>
                    <div className="flex gap-4">
                       <RadioButton name="isIP" value="false" label="No" checked={data.isIP === false} onChange={handleChange} />
                       <RadioButton name="isIP" value="true" label="Yes" checked={data.isIP === true} onChange={handleChange} />
                    </div>
                    {data.isIP && (
                      <input type="text" placeholder="Please specify community" value={data.ipCommunity} onChange={(e) => setData({...data, ipCommunity: e.target.value})} className="flex-1 border-b-2 border-gray-300 bg-transparent outline-none px-2 py-1 text-sm focus:border-[#800000] transition-colors" />
                    )}
                 </div>
              </div>
            </div>
          </section>

          {/* 3. ADDRESS */}
          <section>
            <SectionHeader title="Home Address" icon="🏠" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <InputGroup label="House # / Street" name="addressStreet" value={data.addressStreet} onChange={handleChange} />
               <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} />
               <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} />
               <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} />
               <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" />
            </div>
          </section>

          {/* 4. PARENTS */}
          <section>
            <SectionHeader title="Parent / Guardian Details" icon="👨‍👩‍👦" />
            <p className="text-xs text-gray-500 italic mb-4 ml-1">Note: Please type <strong>N/A</strong> if the information is not available.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Father's Full Name" name="fatherName" value={data.fatherName} onChange={handleChange} placeholder="Last, First, Middle" required />
              <InputGroup label="Mother's Maiden Name" name="motherName" value={data.motherName} onChange={handleChange} placeholder="Last, First, Middle" required />
              <InputGroup label="Guardian's Name" name="guardianName" value={data.guardianName} onChange={handleChange} placeholder="Last, First, Middle" required />
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Contact No. 1" name="contactNumber1" value={data.contactNumber1} onChange={handleChange} type="tel" required />
                 <InputGroup label="Contact No. 2" name="contactNumber2" value={data.contactNumber2} onChange={handleChange} type="tel" />
              </div>
            </div>
          </section>

          {/* 5. PREVIOUS SCHOOL INFO (Conditional) */}
          {showPrevSchool && (
            <section className="bg-blue-50 rounded-2xl p-8 border border-blue-100 animate-fade-in-down">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-blue-800 text-xl">🏫</span>
                <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">Previous School Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Last School Attended" name="lastSchoolName" value={data.lastSchoolName} onChange={handleChange} required />
                <InputGroup label="School Address" name="lastSchoolAddress" value={data.lastSchoolAddress} onChange={handleChange} required />
              </div>

              {/* Only show extra details if Transferee or Returning */}
              {(data.studentType === 'Transferee' || data.studentType === 'Returning') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-blue-200">
                    <InputGroup label="Last Grade Level Completed" name="lastGradeLevel" value={data.lastGradeLevel} onChange={handleChange} />
                    <InputGroup label="Last School Year Completed" name="lastSchoolYear" value={data.lastSchoolYear} onChange={handleChange} />
                    {/* School ID optional */}
                    <InputGroup label="School ID" name="lastSchoolID" value={data.lastSchoolID || ''} onChange={handleChange} /> 
                </div>
              )}
            </section>
          )}

          {/* 6. SHS DETAILS (Conditional) */}
          {data.gradeLevel.includes('SHS') && (
            <div className="bg-[#FFF8E1] rounded-2xl p-8 border border-[#FFD700] relative overflow-hidden transition-all duration-500 animate-fade-in-down">
                <div className="absolute top-0 right-0 text-[#FFECB3] text-9xl font-bold -mt-10 -mr-10 select-none opacity-50">SHS</div>
                <SectionHeader title="Senior High School Details" icon="🎓" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Semester</label>
                        <div className="flex gap-3">
                            <RadioButton name="semester" value="1st Semester" label="1st Sem" checked={data.semester === '1st Semester'} onChange={handleChange} />
                            <RadioButton name="semester" value="2nd Semester" label="2nd Sem" checked={data.semester === '2nd Semester'} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="col-span-1 space-y-4">
                        <InputGroup label="Track" name="track" value={data.track} onChange={handleChange} placeholder="e.g. Academic" disabled={isTrackDisabled} />
                        {showStrand && (<div className="animate-fade-in-down"><InputGroup label="Strand" name="strand" value={data.strand} onChange={handleChange} placeholder="e.g. STEM" /></div>)}
                    </div>
                </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
             <div className="mb-6">
                <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-3 block">Whose name should appear on the printed form as Parent/Guardian?</label>
                <div className="flex flex-wrap gap-6">
                    <RadioButton name="signatory" value="Father" label="Father" checked={data.signatory === 'Father'} onChange={handleChange} />
                    <RadioButton name="signatory" value="Mother" label="Mother" checked={data.signatory === 'Mother'} onChange={handleChange} />
                    <RadioButton name="signatory" value="Guardian" label="Guardian" checked={data.signatory === 'Guardian'} onChange={handleChange} />
                </div>
             </div>
             <button type="submit" disabled={loading} className={`w-full py-4 px-6 rounded-xl font-black text-lg text-white shadow-xl transform transition-all duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800000] hover:bg-[#600000] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]'}`}>
               {loading ? 'PROCESSING...' : 'SUBMIT OFFICIAL ENROLLMENT'}
             </button>
             <p className="text-center text-gray-400 text-xs mt-6 px-4">By clicking submit, I certify that the information above is true and correct to the best of my knowledge and consent to the Data Privacy Act of 2012.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentForm;