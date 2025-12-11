// src/components/EnrollmentPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Helvetica (Standard PDF Font)
const styles = StyleSheet.create({
  page: { 
    paddingTop: 20, 
    paddingBottom: 20, 
    paddingLeft: 25, 
    paddingRight: 25, 
    fontSize: 9, 
    fontFamily: 'Helvetica' 
  },
  
  // --- HEADER & FOOTER IMAGES ---
  headerImage: { width: '100%', height: 75, objectFit: 'contain', alignSelf: 'center' },
  footerImage: { position: 'absolute', bottom: 15, left: 25, width: '92%', height: 45, objectFit: 'contain' },

  // --- TEXT STYLES ---
  mainTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 5,
    marginBottom: 2
  },
  subAddress: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 10
  },
  instructions: { 
    fontSize: 7, 
    fontStyle: 'italic', 
    marginBottom: 5, 
    marginTop: 5,
    color: '#222'
  },

  // --- TABLE GRID SYSTEM ---
  tableContainer: { 
    border: '1px solid #000', 
    borderBottom: 'none', 
    marginTop: 5
  },
  row: { 
    flexDirection: 'row', 
    borderBottom: '1px solid #000', 
    minHeight: 18, 
    alignItems: 'stretch'
  },
  cell: { 
    borderRight: '1px solid #000', 
    padding: 3, 
    justifyContent: 'center',
    flexDirection: 'column'
  },
  lastCell: { 
    borderRight: 'none', 
    padding: 3, 
    justifyContent: 'center',
    flexDirection: 'column'
  },

  // --- LABELS & VALUES ---
  label: { 
    fontSize: 6, 
    color: '#000', 
    fontFamily: 'Helvetica',
    textTransform: 'uppercase',
    marginBottom: 1,
    opacity: 0.8
  },
  value: { 
    fontSize: 9, 
    fontFamily: 'Helvetica-Bold', 
    textTransform: 'uppercase',
    color: '#000'
  },
  
  // Section Headers
  sectionHeader: { 
    backgroundColor: '#e5e7eb', 
    fontSize: 9, 
    fontFamily: 'Helvetica-Bold', 
    paddingVertical: 3, 
    paddingHorizontal: 5, 
    textAlign: 'left', 
    textTransform: 'uppercase',
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000'
  },

  // --- CHECKBOXES ---
  checkboxGroup: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 8, marginLeft: 2, marginRight: 8 },
  box: { 
    width: 10, 
    height: 10, 
    border: '1px solid #000', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  check: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // --- SIGNATORIES ---
  signatureSection: { marginTop: 15, paddingHorizontal: 10 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  sigBox: { width: '45%', alignItems: 'center' },
  sigLine: { width: '100%', borderBottom: '1px solid #000', marginBottom: 2 },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  sigTitle: { fontSize: 8, fontFamily: 'Helvetica' },
  sigTypedName: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 1 }
});

// --- HELPER COMPONENTS ---
const Checkbox = ({ label, checked }) => (
  <View style={styles.checkboxGroup}>
    <View style={styles.box}>
      <Text style={styles.check}>{checked ? '✓' : ''}</Text>
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
  // Construct Full Names for Signatures
  const fullStudentName = `${data.lastName}, ${data.firstName} ${data.middleName || ''} ${data.extension || ''}`;
  
  // Logic to determine which parent name to show based on user selection
  let parentSignatoryName = '';
  if (data.signatory === 'Mother') parentSignatoryName = data.motherName;
  else if (data.signatory === 'Guardian') parentSignatoryName = data.guardianName;
  else parentSignatoryName = data.fatherName; // Default to Father if undefined or selected

  return (
    <Document>
      <Page size={[612, 936]} style={styles.page}>
        
        {/* 1. HEADER */}
        <Image src="/header.png" style={styles.headerImage} />

        <View>
          <Text style={styles.mainTitle}>Basic Education Enrollment Form</Text>
          <Text style={styles.subAddress}>Brgy. Su-ay, Himamaylan City, Negros Occidental</Text>
        </View>

        {/* 2. SY & CHECKBOXES */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', border: '1px solid #000', padding: 5, marginTop: 5 }}>
          <Text style={{ fontSize: 9 }}>School Year: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.schoolYear}</Text></Text>
          <View style={styles.checkboxGroup}>
             <Text style={{ fontSize: 8, marginRight: 5 }}>Check appropriate box:</Text>
             <Checkbox label="No LRN" checked={data.lrnStatus === 'No LRN'} />
             <Checkbox label="With LRN" checked={data.lrnStatus === 'With LRN'} />
             <Checkbox label="Returning" checked={data.lrnStatus === 'Returning'} />
          </View>
        </View>

        <Text style={styles.instructions}>
          INSTRUCTIONS: Print legibly all information required in CAPITAL letters. Submit accomplished form to the Teacher-in-Charge or Registrar. Use black or blue pen only.
        </Text>

        {/* 3. MAIN FORM TABLE */}
        <View style={styles.tableContainer}>
          
          {/* STUDENT INFO */}
          <Text style={styles.sectionHeader}>Student Information</Text>

          <View style={styles.row}>
            <Cell label="Learner Reference No. (LRN)" value={data.lrn} width="50%" />
            <Cell label="PSA Birth Certificate No." value={data.psaCert} width="50%" noBorder />
          </View>

          <View style={styles.row}><Cell label="Last Name" value={data.lastName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="First Name" value={data.firstName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Middle Name" value={data.middleName} width="100%" noBorder /></View>
          
          <View style={styles.row}>
             <Cell label="Extension Name (e.g. Jr., III)" value={data.extension} width="30%" />
             <Cell label="Date of Birth (mm/dd/yyyy)" value={data.dob} width="30%" />
             <View style={[styles.cell, { width: '40%', borderRight: 'none' }]}>
                <Text style={styles.label}>Belonging to IP Community?</Text>
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                   <Checkbox label="No" checked={!data.isIP} />
                   <Checkbox label="Yes" checked={data.isIP} />
                   {data.isIP && <Text style={{ fontSize: 8, marginLeft: 5, borderBottom: '1px solid #000', minWidth: 50 }}>{data.ipCommunity}</Text>}
                </View>
             </View>
          </View>

          <View style={styles.row}>
             <View style={[styles.cell, { width: '30%' }]}>
                <Text style={styles.label}>Sex</Text>
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                   <Checkbox label="Male" checked={data.sex === 'Male'} />
                   <Checkbox label="Female" checked={data.sex === 'Female'} />
                </View>
             </View>
             <Cell label="Age" value={data.age} width="20%" />
             <Cell label="Mother Tongue" value={data.motherTongue} width="50%" noBorder />
          </View>

          {/* ADDRESS */}
          <View style={styles.row}>
             <Cell label="House Number and Street" value={data.addressStreet} width="60%" />
             <Cell label="Barangay" value={data.addressBarangay} width="40%" noBorder />
          </View>
          <View style={styles.row}>
             <Cell label="City/Municipality/Province/Country" value={`${data.addressCity} ${data.addressProvince || ''}`} width="70%" />
             <Cell label="Zip Code" value={data.addressZip} width="30%" noBorder />
          </View>

          {/* PARENTS */}
          <Text style={styles.sectionHeader}>Parent's / Guardian's Information</Text>

          <View style={styles.row}><Cell label="Father's Name (Last, First, Middle)" value={data.fatherName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Mother's Maiden Name (Last, First, Middle)" value={data.motherName} width="100%" noBorder /></View>
          <View style={styles.row}><Cell label="Guardian's Name (Last, First, Middle)" value={data.guardianName} width="100%" noBorder /></View>
          
          <View style={styles.row}>
             <Cell label="Cellphone No. 1" value={data.contactNumber1} width="50%" />
             <Cell label="Cellphone No. 2" value={data.contactNumber2} width="50%" noBorder />
          </View>

          {/* RETURNING / TRANSFEREES */}
          <Text style={styles.sectionHeader}>For Returning Learners (Balik-Aral) and Transferees</Text>
          
          <View style={styles.row}>
             <Cell label="Last Grade Level Completed" value={data.lastGradeLevel} width="50%" />
             <Cell label="Last School Year Completed" value={data.lastSchoolYear} width="50%" noBorder />
          </View>
          <View style={styles.row}>
             <Cell label="School Name" value={data.lastSchoolName} width="60%" />
             <Cell label="School ID" value={data.lastSchoolID} width="40%" noBorder />
          </View>
          <View style={styles.row}><Cell label="School Address" value={data.lastSchoolAddress} width="100%" noBorder /></View>

          {/* SHS */}
          <Text style={styles.sectionHeader}>For Learners in Senior High School</Text>
          <View style={styles.row}>
             <View style={[styles.cell, { width: '25%' }]}>
                <Text style={styles.label}>Semester</Text>
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                   <Checkbox label="1st" checked={data.semester === '1st Semester'} />
                   <Checkbox label="2nd" checked={data.semester === '2nd Semester'} />
                </View>
             </View>
             <Cell label="Track" value={data.track} width="35%" />
             <Cell label="Strand (if any)" value={data.strand} width="40%" noBorder />
          </View>

        </View>

        {/* 4. CERTIFICATION & SIGNATORIES */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 15 }}>
            I hereby certify that the above information given are true and correct to the best of my knowledge and I allow the School - San Ramon Catholic School, Inc. to use my child's details to create and/or update his/her learner profile in the Learner Information System. The information herein shall be treated as confidential.
          </Text>

          {/* Row 1: Parent & Student */}
          <View style={styles.sigRow}>
             
             {/* PARENT SIGNATURE */}
             <View style={styles.sigBox}>
                <Text style={styles.sigTypedName}>{parentSignatoryName}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigName}>Signature of Parent/Guardian</Text>
             </View>
             
             {/* STUDENT SIGNATURE */}
             <View style={styles.sigBox}>
                <Text style={styles.sigTypedName}>{fullStudentName}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigName}>Signature of Student</Text>
             </View>
          </View>

          {/* Row 2: Registrar & Cashier */}
          <View style={styles.sigRow}>
             <View style={styles.sigBox}>
                <Text style={styles.sigName}>EUSEBIO JR S. LABRADOR, LPT</Text>
                <Text style={styles.sigTitle}>Registrar</Text>
             </View>
             <View style={styles.sigBox}>
                <Text style={styles.sigName}>LEOPOLDO B. TORNOS JR</Text>
                <Text style={styles.sigTitle}>Cashier</Text>
             </View>
          </View>

          {/* Row 3: Principal */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
             <Text style={{ fontSize: 8, marginBottom: 5 }}>Approved:</Text>
             <View style={{ width: '40%', alignItems: 'center', borderBottom: '1px solid #000' }}>
                 <Text style={styles.sigName}>YVONNE T. MADALAG, LPT, MA-ELM</Text>
             </View>
             <Text style={styles.sigTitle}>Principal</Text>
          </View>
        </View>

        {/* 5. DEPED PERSONNEL ONLY BOX */}
        <View style={{ border: '1px solid #000', marginTop: 15, padding: 5 }}>
          
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-BoldOblique', marginBottom: 8 }}>
             For use of DepEd Personnel Only. To be filled up by the Class Adviser
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', fontSize: 9 }}>
             
             <Text style={{ marginBottom: 1 }}>Date of First Attendance: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 100, marginHorizontal: 3 }} />

             <Text style={{ marginBottom: 1, marginLeft: 10 }}>Grade Level: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 80, alignItems: 'center', marginHorizontal: 3 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 }}>{data.gradeLevel}</Text>
             </View>

             <Text style={{ marginBottom: 1, marginLeft: 10 }}>Track: </Text>
             <View style={{ borderBottom: '1px solid #000', width: 80, alignItems: 'center', marginHorizontal: 3 }}>
                 <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 1 }}>{data.track}</Text>
             </View>

          </View>
        </View>

        {/* 6. FOOTER */}
        <Image src="/footer.png" style={styles.footerImage} />

      </Page>
    </Document>
  );
};

export default EnrollmentPDF;