// src/components/EnrollmentPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    paddingTop: 15,    
    paddingBottom: 15, 
    paddingLeft: 30,   
    paddingRight: 30, 
    fontSize: 9, 
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF'
  },
  
  // --- HEADER & FOOTER ---
  headerImage: { 
    width: '100%', 
    height: 60, 
    objectFit: 'contain', 
    alignSelf: 'center' 
  },
  footerImage: { 
    position: 'absolute', 
    bottom: 10, 
    left: 30, 
    width: '90%', 
    height: 60, 
    objectFit: 'contain' 
  },

  // --- TEXT STYLES ---
  mainTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4, 
    marginBottom: 4,
    color: '#111'
  },
  instructions: { 
    fontSize: 7, 
    fontStyle: 'italic', 
    marginBottom: 4, 
    marginTop: 4,
    color: '#666',
    textAlign: 'center'
  },

  // --- TABLE SYSTEM ---
  tableContainer: { 
    border: '1px solid #000', 
    borderBottom: 'none', 
    marginTop: 2,
    width: '100%'
  },
  row: { 
    flexDirection: 'row', 
    borderBottom: '1px solid #000', 
    height: 26, 
    alignItems: 'stretch'
  },
  cell: { 
    borderRight: '1px solid #000', 
    paddingHorizontal: 4,
    paddingTop: 3, 
    paddingBottom: 0,
    justifyContent: 'flex-start', 
    flexDirection: 'column'
  },
  lastCell: { 
    borderRight: 'none', 
    paddingHorizontal: 4,
    paddingTop: 3, 
    paddingBottom: 0,
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },

  // --- TYPOGRAPHY ---
  label: { 
    fontSize: 5.5, 
    color: '#555', 
    fontFamily: 'Helvetica',
    textTransform: 'uppercase',
    marginBottom: 0, 
    letterSpacing: 0.2
  },
  value: { 
    fontSize: 11, 
    fontFamily: 'Helvetica-Bold', 
    textTransform: 'uppercase',
    color: '#000',
    marginTop: 1
  },
  
  // Section Headers
  sectionHeader: { 
    backgroundColor: '#D1D5DB', 
    fontSize: 11, 
    fontFamily: 'Helvetica-Bold', 
    paddingVertical: 4, 
    paddingHorizontal: 6, 
    textAlign: 'left', 
    textTransform: 'uppercase',
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000',
    color: '#000'
  },

  // --- CHECKBOXES ---
  checkboxGroup: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 8, marginLeft: 3, marginRight: 8, color: '#333' },
  box: { 
    width: 10, 
    height: 10, 
    border: '1px solid #000', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFF' 
  },
  check: { 
    fontSize: 8, 
    fontFamily: 'Helvetica-Bold', 
    marginTop: -1, 
    color: '#000' 
  },

  // --- SIGNATORIES ---
  sigRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sigBox: { width: '45%', alignItems: 'center' },
  sigLine: { width: '100%', borderBottom: '1px solid #000', marginBottom: 2 },
  sigName: { 
    fontSize: 9, 
    fontFamily: 'Helvetica-Bold', 
    textTransform: 'uppercase', 
    borderBottom: '1px solid #000', 
    paddingBottom: 2, 
    marginBottom: 2,
    textAlign: 'center',
    width: '100%'
  },
  sigTitle: { fontSize: 7, fontFamily: 'Helvetica', color: '#444' },
  sigTypedName: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2, textAlign: 'center' }
});

// --- HELPER FUNCTIONS ---

const formatDateToWords = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; 
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const Checkbox = ({ label, checked }) => (
  <View style={styles.checkboxGroup}>
    <View style={styles.box}>
      <Text style={styles.check}>{checked ? 'X' : ''}</Text>
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </View>
);

const Cell = ({ label, value, width, noBorder }) => (
  <View style={[noBorder ? styles.lastCell : styles.cell, { width }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || ''}</Text>
  </View>
);

const EnrollmentPDF = ({ data }) => {
  const fullStudentName = `${data.lastName}, ${data.firstName} ${data.middleName || ''} ${data.extension || ''}`;
  
  const isIP = data.isIP === true || data.isIP === 'true';
  const isMale = data.sex === 'Male';
  const isFemale = data.sex === 'Female';
  
  let parentSignatoryName = '';
  if (data.signatory === 'Mother') parentSignatoryName = data.motherName;
  else if (data.signatory === 'Guardian') parentSignatoryName = data.guardianName;
  else parentSignatoryName = data.fatherName; 

  return (
    <Document>
      <Page size={[612, 936]} style={styles.page}>
        
        {/* HEADER */}
        <Image src="/header.png" style={styles.headerImage} />

        <Text style={styles.mainTitle}>Basic Education Enrollment Form</Text>

        {/* CONTROLS ROW */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', border: '1px solid #000', padding: 4, marginTop: 2, alignItems: 'center', backgroundColor: '#FAFAFA' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={{ fontSize: 8, color: '#444', marginRight: 4 }}>School Year:</Text>
             <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>{data.schoolYear}</Text>
          </View>
          <View style={styles.checkboxGroup}>
             <Text style={{ fontSize: 6, marginRight: 6, color: '#555', textTransform: 'uppercase' }}>Check appropriate box:</Text>
             <Checkbox label="No LRN" checked={data.lrnStatus === 'No LRN'} />
             <Checkbox label="With LRN" checked={data.lrnStatus === 'With LRN'} />
             <Checkbox label="Returning" checked={data.lrnStatus === 'Returning'} />
          </View>
        </View>

        <Text style={styles.instructions}>
          INSTRUCTIONS: Print legibly all information required in CAPITAL letters. Submit accomplished form to the Teacher-in-Charge or Registrar. Use black or blue pen only.
        </Text>

        {/* --- MAIN DATA TABLE --- */}
        <View style={styles.tableContainer}>
          
          {/* 1. STUDENT INFO */}
          <Text style={styles.sectionHeader}>Student Information</Text>

          <View style={styles.row}>
            <Cell label="Learner Reference No. (LRN)" value={data.lrn} width="50%" />
            <Cell label="PSA Birth Certificate No." value={data.psaCert} width="50%" noBorder />
          </View>

          <View style={styles.row}><Cell label="Last Name" value={data.lastName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="First Name" value={data.firstName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Middle Name" value={data.middleName} width="100%" noBorder /></View>
          
          {/* Aligned to 25% | 25% | 50% grid */}
          <View style={styles.row}>
             <Cell label="Extension Name" value={data.extension} width="25%" />
             <Cell label="Date of Birth" value={formatDateToWords(data.dob)} width="25%" />
             <View style={[styles.cell, { width: '50%', borderRight: 'none' }]}>
                <Text style={styles.label}>Belonging to IP Community?</Text>
                <View style={{ flexDirection: 'row', marginTop: 1 }}>
                   <Checkbox label="No" checked={!isIP} />
                   <Checkbox label="Yes" checked={isIP} />
                   {isIP && <Text style={{ fontSize: 8, marginLeft: 5, borderBottom: '1px solid #000', minWidth: 60, marginTop: -2 }}>{data.ipCommunity}</Text>}
                </View>
             </View>
          </View>

          {/* Aligned to 25% | 25% | 50% grid */}
          <View style={styles.row}>
             <View style={[styles.cell, { width: '25%' }]}>
                <Text style={styles.label}>Sex</Text>
                <View style={{ flexDirection: 'row', marginTop: 1 }}>
                   <Checkbox label="Male" checked={isMale} />
                   <Checkbox label="Female" checked={isFemale} />
                </View>
             </View>
             <Cell label="Age" value={data.age} width="25%" />
             <Cell label="Mother Tongue" value={data.motherTongue} width="50%" noBorder />
          </View>

          {/* Aligned to 75% | 25% grid (Matched with City/Zip) */}
          <View style={styles.row}>
             <Cell label="House Number and Street" value={data.addressStreet} width="75%" />
             <Cell label="Barangay" value={data.addressBarangay} width="25%" noBorder />
          </View>
          <View style={styles.row}>
             <Cell label="City/Municipality/Province" value={`${data.addressCity} ${data.addressProvince || ''}`} width="75%" />
             <Cell label="Zip Code" value={data.addressZip} width="25%" noBorder />
          </View>

          {/* 2. PARENTS INFO */}
          <Text style={styles.sectionHeader}>Parent's / Guardian's Information</Text>

          <View style={styles.row}><Cell label="Father's Name" value={data.fatherName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Mother's Maiden Name" value={data.motherName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Guardian's Name" value={data.guardianName} width="100%" noBorder /></View>
          
          <View style={styles.row}>
             <Cell label="Cellphone No. 1" value={data.contactNumber1} width="50%" />
             <Cell label="Cellphone No. 2" value={data.contactNumber2} width="50%" noBorder />
          </View>

          {/* 3. RETURNING & SENIOR HIGH */}
          <Text style={styles.sectionHeader}>Returning Learners / Transferees / Senior High School</Text>
          
          {/* Aligned to 25% | 25% | 50% grid */}
          <View style={styles.row}>
             <Cell label="Last Grade Level" value={data.lastGradeLevel} width="25%" />
             <Cell label="Last SY" value={data.lastSchoolYear} width="25%" />
             <Cell label="School ID" value={data.lastSchoolID} width="50%" noBorder />
          </View>
          <View style={styles.row}>
             <Cell label="Last School Name" value={data.lastSchoolName} width="100%" noBorder />
          </View>
          
          {/* Aligned to 25% | 25% | 50% grid */}
          <View style={styles.row}>
             <View style={[styles.cell, { width: '25%' }]}>
                <Text style={styles.label}>SHS Semester</Text>
                <View style={{ flexDirection: 'row', marginTop: 1 }}>
                   <Checkbox label="1st" checked={data.semester === '1st Semester'} />
                   <Checkbox label="2nd" checked={data.semester === '2nd Semester'} />
                </View>
             </View>
             <Cell label="Track" value={data.track} width="25%" />
             <Cell label="Strand" value={data.strand} width="50%" noBorder />
          </View>

        </View>

        {/* CERTIFICATION */}
        <View style={{ marginTop: 8, paddingHorizontal: 5 }}>
          <Text style={{ fontSize: 7, textAlign: 'justify', lineHeight: 1.2, color: '#333' }}>
            I hereby certify that the above information given are true and correct to the best of my knowledge and I allow San Ramon Catholic School, Inc. to use my child's details to create/update his/her learner profile in the Learner Information System. The information herein shall be treated as confidential.
          </Text>

          {/* SIGNATORIES 1: Parent & Student */}
          <View style={[styles.sigRow, { marginTop: 20 }]}>
             <View style={styles.sigBox}>
                <Text style={styles.sigTypedName}>{parentSignatoryName}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigTitle}>Signature of Parent/Guardian</Text>
             </View>
             <View style={styles.sigBox}>
                <Text style={styles.sigTypedName}>{fullStudentName}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigTitle}>Signature of Student</Text>
             </View>
          </View>

          {/* SIGNATORIES 2: Officials */}
          <View style={[styles.sigRow, { marginTop: 25 }]}> 
             <View style={styles.sigBox}>
                <Text style={styles.sigName}>EUSEBIO JR S. LABRADOR, LPT</Text>
                <Text style={styles.sigTitle}>Registrar</Text>
             </View>
             <View style={styles.sigBox}>
                <Text style={styles.sigName}>LEOPOLDO B. TORNOS JR</Text>
                <Text style={styles.sigTitle}>Cashier</Text>
             </View>
          </View>

          {/* SIGNATORIES 3: Principal */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
             <Text style={{ fontSize: 7, marginBottom: 1 }}>Approved:</Text>
             <View style={{ width: '40%', alignItems: 'center' }}>
                 <Text style={styles.sigName}>YVONNE T. MADALAG, LPT, MA-ELM</Text>
                 <Text style={styles.sigTitle}>Principal</Text>
             </View>
          </View>
        </View>

        {/* DEPED BOX */}
        <View style={{ border: '1px solid #000', marginTop: 50, marginBottom: 40, padding: 4 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-BoldOblique', marginBottom: 4 }}>
             For use of DepEd Personnel Only. To be filled up by the Class Adviser
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', fontSize: 8 }}>
             <Text style={{ marginBottom: 1 }}>Date of First Attendance: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 80, marginHorizontal: 3 }} />
             
             <Text style={{ marginBottom: 1, marginLeft: 8 }}>Grade Level: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 60, alignItems: 'center', marginHorizontal: 3 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 1 }}>{data.gradeLevel}</Text>
             </View>
             
             <Text style={{ marginBottom: 1, marginLeft: 8 }}>Track: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 60, alignItems: 'center', marginHorizontal: 3 }}>
                 <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 1 }}>{data.track}</Text>
             </View>
          </View>
        </View>

        {/* FOOTER */}
        <Image src="/footer.png" style={styles.footerImage} />

      </Page>
    </Document>
  );
};

export default EnrollmentPDF;