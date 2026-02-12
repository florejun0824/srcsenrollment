import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
    header: { marginBottom: 20, textAlign: 'center' },
    title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
    subtitle: { fontSize: 10, color: '#666' },
    section: { marginBottom: 15 },
    sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 5, backgroundColor: '#f0f0f0', padding: 5 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4 },
    label: { flex: 1 },
    value: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
    totalRow: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000', marginTop: 5, paddingTop: 5 },
    totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingRight: 10 },
    totalValue: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' }
});

const FeeTable = ({ title, data }) => {
    const standardTotal = Object.values(data.standard).reduce((a, b) => a + Number(b), 0);
    const nonStandardTotal = Object.values(data.nonStandard).reduce((a, b) => a + Number(b), 0);
    const grandTotal = Number(data.tuition) + standardTotal + nonStandardTotal;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            
            <View style={styles.row}>
                <Text style={styles.label}>Tuition Fee</Text>
                <Text style={styles.value}>{Number(data.tuition).toLocaleString('en-PH', {minimumFractionDigits: 2})}</Text>
            </View>

            <Text style={{ marginTop: 10, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#444' }}>Standard / Miscellaneous</Text>
            {Object.entries(data.standard).map(([k, v]) => (
                <View key={k} style={styles.row}>
                    <Text style={styles.label}>{k}</Text>
                    <Text style={styles.value}>{Number(v).toLocaleString('en-PH', {minimumFractionDigits: 2})}</Text>
                </View>
            ))}

            <Text style={{ marginTop: 10, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#444' }}>Other Fees</Text>
            {Object.entries(data.nonStandard).map(([k, v]) => (
                <View key={k} style={styles.row}>
                    <Text style={styles.label}>{k}</Text>
                    <Text style={styles.value}>{Number(v).toLocaleString('en-PH', {minimumFractionDigits: 2})}</Text>
                </View>
            ))}

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL ASSESSMENT</Text>
                <Text style={styles.totalValue}>{grandTotal.toLocaleString('en-PH', {style: 'currency', currency: 'PHP'})}</Text>
            </View>
        </View>
    );
};

const FeeBreakdownPDF = ({ fees }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>School Fee Schedule</Text>
                <Text style={styles.subtitle}>San Ramon Catholic School, Inc.</Text>
            </View>
            <FeeTable title="Junior High School (Grade 7-10)" data={fees.JHS} />
            <Text style={{ marginBottom: 20 }}> </Text>
            <FeeTable title="Senior High School (Grade 11-12)" data={fees.SHS} />
        </Page>
    </Document>
);

export default FeeBreakdownPDF;