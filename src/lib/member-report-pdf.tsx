import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  getMemberReportColumnValue,
  MemberReportData,
  MEMBER_REPORT_PRINT_COLUMNS,
} from "@/lib/member-report";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    color: "#241f1f",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#7c1d1d",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 9,
    color: "#f7d7bf",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: 700,
    marginBottom: 6,
  },
  headerText: {
    fontSize: 9,
    color: "#f7ebe2",
    lineHeight: 1.5,
  },
  metaGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    width: "48%",
  },
  metaLabel: {
    fontSize: 8,
    color: "#f3d7cb",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: "#ffffff",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d9cdc3",
    backgroundColor: "#f7f1ea",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#efe4da",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cell: {
    paddingRight: 8,
    fontSize: 9,
  },
  studentName: {
    fontWeight: 700,
    marginBottom: 2,
  },
  studentEmail: {
    color: "#6d625f",
    fontSize: 8,
  },
  emptyState: {
    paddingVertical: 24,
    textAlign: "center",
    color: "#6d625f",
  },
});

const columnWidths: Record<string, string> = {
  student: "24%",
  role: "10%",
  yearLevel: "10%",
  overallStatus: "11%",
  paymentMode: "11%",
  balanceDue: "10%",
  recentFullPaymentDate: "12%",
  recentInstallmentPaymentDate: "12%",
  overdueSummary: "10%",
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

function formatGeneratedDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatValue(value: string | number, kind?: "text" | "currency" | "date" | "number") {
  if (kind === "currency" && typeof value === "number") {
    return currencyFormatter.format(value);
  }

  return String(value || "-");
}

export function MemberReportPdfDocument({
  orgId,
  report,
}: {
  orgId: string | null;
  report: MemberReportData;
}) {
  return (
    <Document
      title={`Members Report ${orgId || "Org"}`}
      author="DominiFunds"
      subject="Members payment standing report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>DominiFunds Officer Reporting Suite</Text>
          <Text style={styles.headerTitle}>Members Payment Standing Report</Text>
          <Text style={styles.headerText}>
            Student payment standing, installment activity, overdue balances, and recent collections.
          </Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Organization</Text>
              <Text style={styles.metaValue}>{orgId || "N/A"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>{formatGeneratedDate(report.generatedAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Search</Text>
              <Text style={styles.metaValue}>{report.filters.search || "None"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{report.filters.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          {MEMBER_REPORT_PRINT_COLUMNS.map((column) => (
            <Text
              key={column.key}
              style={{ ...styles.cell, width: columnWidths[column.key] || "10%", fontWeight: 700 }}
            >
              {column.header}
            </Text>
          ))}
        </View>

        {report.rows.length === 0 ? (
          <Text style={styles.emptyState}>No members matched the selected filters.</Text>
        ) : (
          report.rows.map((row) => (
            <View key={row.id} style={styles.tableRow} wrap={false}>
              {MEMBER_REPORT_PRINT_COLUMNS.map((column) => (
                <View key={column.key} style={{ ...styles.cell, width: columnWidths[column.key] || "10%" }}>
                  {column.key === "student" ? (
                    <>
                      <Text style={styles.studentName}>{row.name}</Text>
                      <Text style={styles.studentEmail}>{row.email}</Text>
                    </>
                  ) : (
                    <Text>
                      {formatValue(getMemberReportColumnValue(row, column.key), column.kind)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
