import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  reportTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 10, textDecoration: 'underline' },
  dateRange: { fontSize: 9, color: '#555', marginTop: 4 },

  table: { marginTop: 10, border: '1px solid #000', borderBottom: 'none' },
  row: { flexDirection: 'row', borderBottom: '1px solid #000', alignItems: 'center' },
  headerRow: { backgroundColor: '#f0f0f0', borderBottom: '1px solid #000' },
  
  // Columns
  colDate: { width: '15%', padding: 4, borderRight: '1px solid #000' },
  colOR: { width: '15%', padding: 4, borderRight: '1px solid #000' },
  colName: { width: '40%', padding: 4, borderRight: '1px solid #000' },
  colMode: { width: '15%', padding: 4, borderRight: '1px solid #000' },
  colAmount: { width: '15%', padding: 4, textAlign: 'right' },

  totalSection: { marginTop: 15, flexDirection: 'row', justifyContent: 'flex-end', borderTop: '2px solid #000', paddingTop: 5 },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginRight: 10 },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#888' }
});

// Helper
const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const TransactionReportPDF = ({ transactions, dateRange }) => {
  const totalCollection = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <Text style={styles.schoolName}>San Ramon Catholic School, Inc.</Text>
            <Text>Su-ay, Himamaylan City, Negros Occidental</Text>
            <Text style={styles.reportTitle}>COLLECTION REPORT</Text>
            <Text style={styles.dateRange}>
                Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
            </Text>
        </View>

        {/* TABLE HEADERS */}
        <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colOR}>OR Number</Text>
            <Text style={styles.colName}>Student Name</Text>
            <Text style={styles.colMode}>Mode</Text>
            <Text style={styles.colAmount}>Amount</Text>
        </View>

        {/* ROWS */}
        {transactions.map((t, i) => (
            <View key={i} style={styles.row}>
                <Text style={styles.colDate}>{new Date(t.date.seconds * 1000).toLocaleDateString()}</Text>
                <Text style={styles.colOR}>{t.orNumber}</Text>
                <Text style={styles.colName}>{t.studentName}</Text>
                <Text style={styles.colMode}>{t.mode}</Text>
                <Text style={styles.colAmount}>{t.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
            </View>
        ))}

        {/* TOTAL */}
        <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL COLLECTIONS:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalCollection)}</Text>
        </View>

        <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  );
};

export default TransactionReportPDF;