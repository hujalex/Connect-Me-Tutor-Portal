import React from "react";
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Profile } from "@/types";

interface HoursPDFData {
  tutors: Profile[];
  totalSessionHours: { [key: string]: number };
  totalEventHours: { [key: string]: number };
  totalMonthlyHours: number;
  totalHours: number;
  allTimeSessionHours: { [key: string]: { [key: string]: number } };
  eventHoursData: { [key: string]: { [key: string]: number } };
  allTimeHours: { [key: string]: number };
  weeklySessionHours: { [key: string]: { [key: string]: number } };
  monthyHours: { [key: string]: number };
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "11%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
  },
  tableCol: {
    width: "11%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: "auto",
    marginTop: 5,
    marginBottom: 5,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    marginBottom: 5,
    fontSize: 8,
    textAlign: "center",
  },
  tutorNameCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f8f8f8",
  },
  tutorNameColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#e0e0e0",
  },
  totalsRow: {
    backgroundColor: "#e8f4f8",
    fontWeight: "bold",
  },
  summarySection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  summaryText: {
    fontSize: 10,
    marginBottom: 5,
  },
});

const MyPDFDocument: React.FC<{ data: HoursPDFData }> = ({ data }) => {
  // Helper function to safely get hours with default of 0
  const getHours = (
    obj: { [key: string]: number } | undefined,
    key: string
  ): number => {
    return obj?.[key] || 0;
  };

  // Calculate totals for each column
  const calculateColumnTotals = () => {
    const totals = {
      sessionHours: 0,
      eventHours: 0,
      monthlyHours: 0,
      allTimeHours: 0,
    };

    data.tutors.forEach((tutor) => {
      totals.sessionHours += getHours(data.totalSessionHours, tutor.id);
      totals.eventHours += getHours(data.totalEventHours, tutor.id);
      totals.monthlyHours += getHours(data.monthyHours, tutor.id);
      totals.allTimeHours += getHours(data.allTimeHours, tutor.id);
    });

    return totals;
  };

  const columnTotals = calculateColumnTotals();

  return (
    <PDFDocument>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Tutor Hours Report</Text>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={styles.tutorNameColHeader}>
              <Text style={styles.tableCellHeader}>Tutor Name</Text>
            </View>
            <View style={styles.tableColHeader}>
                <Text style = {styles.tableCellHeader}></Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Session Hours</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Event Hours</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Monthly Hours</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>All Time Hours</Text>
            </View>
          </View>

          {/* Data Rows - Loop through tutors */}
          {data.tutors.map((tutor) => (
            <View key={tutor.id} style={styles.tableRow}>
              <View style={styles.tutorNameCol}>
                <Text style={styles.tableCell}>
                  {tutor.firstName + " " + tutor.lastName}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {getHours(data.totalSessionHours, tutor.id).toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {getHours(data.totalEventHours, tutor.id).toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {getHours(data.monthyHours, tutor.id).toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {getHours(data.allTimeHours, tutor.id).toFixed(1)}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals Row */}
          <View style={[styles.tableRow, styles.totalsRow]}>
            <View style={styles.tutorNameCol}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                TOTALS
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                {columnTotals.sessionHours.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                {columnTotals.eventHours.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                {columnTotals.monthlyHours.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                {columnTotals.allTimeHours.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text
            style={[styles.summaryText, { fontWeight: "bold", fontSize: 12 }]}
          >
            Summary
          </Text>
          <Text style={styles.summaryText}>
            Total Monthly Hours: {data.totalMonthlyHours.toFixed(1)}
          </Text>
          <Text style={styles.summaryText}>
            Grand Total Hours: {data.totalHours.toFixed(1)}
          </Text>
          <Text style={styles.summaryText}>
            Total Tutors: {data.tutors.length}
          </Text>
        </View>
      </Page>
    </PDFDocument>
  );
};

export default MyPDFDocument;
