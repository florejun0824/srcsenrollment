import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// 5.5 inches x 5.5 inches
const PAGE_SIZE = [396, 396]; 

const styles = StyleSheet.create({
  page: { 
    padding: 15, // Single padding source for safety margin
    fontSize: 8, // Slightly reduced base font
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#111'
  },
  // Main Container fills the page minus padding
  container: {
    border: '1px solid #333',
    flex: 1, // Forces it to take full height of one page
    display: 'flex',
    flexDirection: 'column'
  },
  
  // --- HEADER SECTION ---
  header: {
    flexDirection: 'row',
    padding: 8, // Reduced padding
    borderBottom: '1px solid #333',
    alignItems: 'center',
    backgroundColor: '#f8f8f8'
  },
  logo: {
    width: 28, // Slightly smaller
    height: 28,
    marginRight: 8,
    objectFit: 'contain',
    opacity: 0.9
  },
  headerText: {
    flex: 1
  },
  schoolName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 1
  },
  subText: {
    fontSize: 6,
    color: '#444'
  },
  receiptBadge: {
    border: '1px solid #000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2
  },
  receiptTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase'
  },

  // --- INFO BAR (Date & OR) ---
  infoBar: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    backgroundColor: '#fff'
  },
  infoItem: {
    flexDirection: 'column'
  },
  label: {
    fontSize: 5,
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 1
  },
  value: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold'
  },

  // --- PAYOR DETAILS ---
  payorSection: {
    padding: 8,
    borderBottom: '1px solid #eee'
  },
  payorRow: {
    flexDirection: 'row',
    marginBottom: 2
  },
  payorLabel: { width: 55, fontSize: 7, color: '#555' },
  payorValue: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // --- TABLE SECTION ---
  tableSection: {
    flex: 1, // Takes up remaining space
    padding: 8
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingBottom: 2,
    marginBottom: 3
  },
  thDesc: { width: '70%', fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  thAmt: { width: '30%', fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottom: '1px dashed #eee'
  },
  tdDesc: { width: '70%', fontSize: 8 },
  tdAmt: { width: '30%', fontSize: 8, textAlign: 'right', fontFamily: 'Helvetica' },

  // --- FOOTER SECTION ---
  footer: {
    padding: 8,
    borderTop: '1px solid #333',
    backgroundColor: '#f8f8f8'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10 // Reduced margin
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginRight: 8,
    textTransform: 'uppercase'
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    borderBottom: '1px double #000',
    paddingBottom: 1
  },
  
  signatoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2
  },
  metaText: { fontSize: 5, color: '#888' },
  signBox: { alignItems: 'center', width: 100 },
  signLine: { width: '100%', borderBottom: '1px solid #000', marginBottom: 2 },
  signName: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  signTitle: { fontSize: 5, color: '#555', textTransform: 'uppercase' },

  // --- WATERMARK ---
  watermark: {
    position: 'absolute',
    top: 150, // Adjusted position
    left: 80,
    fontSize: 50, // Larger but lighter
    color: '#f3f3f3', // Extremely light gray
    transform: 'rotate(-30deg)',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    zIndex: -1
  },
  
  systemText: {
    textAlign: 'center', 
    fontSize: 5, 
    marginTop: 4, 
    color: '#999', 
    fontFamily: 'Helvetica' 
  }
});

const OfficialReceiptPDF = ({ payment, student }) => {
  // --- DATE HANDLING ---
  let paymentDate = new Date();
  if (payment?.date) {
      if (payment.date.seconds) {
          paymentDate = new Date(payment.date.seconds * 1000);
      } else {
          paymentDate = new Date(payment.date);
      }
  }

  return (
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        {/* Main Content Container */}
        <View style={styles.container}>
            
            {/* WATERMARK */}
            <Text style={styles.watermark}>PAID</Text>

            {/* 1. HEADER */}
            <View style={styles.header}>
                <Image src="/logobw.png" style={styles.logo} />
                <View style={styles.headerText}>
                    <Text style={styles.schoolName}>San Ramon Catholic School, Inc.</Text>
                    <Text style={styles.subText}>Su-ay, Himamaylan City</Text>
                </View>
                <View style={styles.receiptBadge}>
                    <Text style={styles.receiptTitle}>Official Receipt</Text>
                </View>
            </View>

            {/* 2. INFO BAR */}
            <View style={styles.infoBar}>
                <View style={styles.infoItem}>
                    <Text style={styles.label}>OR Number</Text>
                    <Text style={styles.value}>{payment.orNumber}</Text>
                </View>
                <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
                    <Text style={styles.label}>Date Issued</Text>
                    <Text style={styles.value}>{paymentDate.toLocaleDateString()}</Text>
                </View>
            </View>

            {/* 3. PAYOR DETAILS */}
            <View style={styles.payorSection}>
                <View style={styles.payorRow}>
                    <Text style={styles.payorLabel}>Received From:</Text>
                    <Text style={styles.payorValue}>{student.lastName}, {student.firstName}</Text>
                </View>
                <View style={styles.payorRow}>
                    <Text style={styles.payorLabel}>Grade Level:</Text>
                    <Text style={styles.payorValue}>{student.gradeLevel} {student.section ? ` - ${student.section}` : ''}</Text>
                </View>
            </View>

            {/* 4. PAYMENT BREAKDOWN (Fills available space) */}
            <View style={styles.tableSection}>
                <View style={styles.tableHeader}>
                    <Text style={styles.thDesc}>Particulars / Description</Text>
                    <Text style={styles.thAmt}>Amount</Text>
                </View>

                {payment.allocation && Object.entries(payment.allocation).map(([item, amount]) => (
                    amount > 0 && (
                        <View key={item} style={styles.tableRow}>
                            <Text style={styles.tdDesc}>{item}</Text>
                            <Text style={styles.tdAmt}>{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    )
                ))}
            </View>

            {/* 5. FOOTER & TOTAL */}
            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalValue}>P {payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
                </View>

                <View style={styles.signatoryRow}>
                    <View>
                        <Text style={styles.metaText}>Payment Mode: {payment.mode}</Text>
                        <Text style={styles.metaText}>Time: {paymentDate.toLocaleTimeString()}</Text>
                    </View>
                    
                    <View style={styles.signBox}>
                        <View style={styles.signLine} />
                        <Text style={styles.signName}>{payment.processedBy || 'Cashier'}</Text>
                        <Text style={styles.signTitle}>Authorized Signature</Text>
                    </View>
                </View>
            </View>

        </View>
        <Text style={styles.systemText}>
            System Generated | Valid as Proof of Payment
        </Text>
      </Page>
    </Document>
  );
};

export default OfficialReceiptPDF;