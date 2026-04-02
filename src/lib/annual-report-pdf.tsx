import React from "react";
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from "@react-pdf/renderer";
import type { ReportData } from "@/lib/annual-report";
import { getOrgDisplayName } from "@/lib/org-display";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

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
  section: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eadfd5",
    backgroundColor: "#fffaf7",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#352826",
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#efe4da",
  },
  kpiLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#8b756f",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#7c1d1d",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#efe4da",
    paddingVertical: 6,
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    color: "#433533",
  },
  rowValue: {
    width: "34%",
    textAlign: "right",
    color: "#241f1f",
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d9cdc3",
    backgroundColor: "#f7f1ea",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#efe4da",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cell: {
    fontSize: 9,
    paddingRight: 8,
  },
  emptyState: {
    paddingVertical: 16,
    textAlign: "center",
    color: "#6d625f",
  },
});

const monthlyColumnWidths = ["38%", "22%"];
const fundColumnWidths = ["34%", "18%", "18%", "18%", "12%"];
const installmentColumnWidths = ["30%", "28%", "20%", "22%"];
const officerColumnWidths = ["22%", "28%", "30%", "20%"];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

export function AnnualReportPdfDocument({
  orgId,
  year,
  generatedAt,
  report,
}: {
  orgId: string;
  year: number;
  generatedAt: string;
  report: ReportData;
}): React.ReactElement<DocumentProps> {
  const orgDisplayName = getOrgDisplayName(orgId, orgId);

  return (
    <Document
      title={`${orgDisplayName} Annual Report ${year}`}
      author="DominiFunds"
      subject="Executive annual report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>DominiFunds Executive Reporting</Text>
          <Text style={styles.headerTitle}>Annual Report</Text>
          <Text style={styles.headerText}>
            Annual financial summary for collections, installments, fund performance, and officer activity.
          </Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Organization</Text>
              <Text style={styles.metaValue}>{orgDisplayName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Report Year</Text>
              <Text style={styles.metaValue}>{String(year)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>{formatDate(generatedAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prepared By</Text>
              <Text style={styles.metaValue}>DominiFunds</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Collected</Text>
              <Text style={styles.kpiValue}>{formatMoney(report.kpis.totalCollected)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Installment Plans</Text>
              <Text style={styles.kpiValue}>{String(report.kpis.installmentPlansCreated)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Completion Rate</Text>
              <Text style={styles.kpiValue}>{report.kpis.completionRatePercent}%</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Collection Rate</Text>
              <Text style={styles.kpiValue}>{report.kpis.collectionRatePercent}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Standing Snapshot</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Good Standing</Text>
            <Text style={styles.rowValue}>{`${report.standings.goodStanding.count} (${report.standings.goodStanding.percent}%)`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Active Installment</Text>
            <Text style={styles.rowValue}>{`${report.standings.activeInstallment.count} (${report.standings.activeInstallment.percent}%)`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Overdue</Text>
            <Text style={styles.rowValue}>{`${report.standings.overdue.count} (${report.standings.overdue.percent}%)`}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Collections</Text>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.cell, width: monthlyColumnWidths[0], fontWeight: 700 }}>Month</Text>
            <Text style={{ ...styles.cell, width: monthlyColumnWidths[1], fontWeight: 700, textAlign: "right" }}>Collected</Text>
          </View>
          {report.monthlyCollections.map((month) => (
            <View key={month.month} style={styles.tableRow}>
              <Text style={{ ...styles.cell, width: monthlyColumnWidths[0] }}>{month.month}</Text>
              <Text style={{ ...styles.cell, width: monthlyColumnWidths[1], textAlign: "right" }}>
                {formatMoney(month.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fund Breakdown</Text>
          {report.fundBreakdowns.length === 0 ? (
            <Text style={styles.emptyState}>No fund activity was recorded for this year.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.cell, width: fundColumnWidths[0], fontWeight: 700 }}>Fund</Text>
                <Text style={{ ...styles.cell, width: fundColumnWidths[1], fontWeight: 700, textAlign: "right" }}>Total</Text>
                <Text style={{ ...styles.cell, width: fundColumnWidths[2], fontWeight: 700, textAlign: "right" }}>Full</Text>
                <Text style={{ ...styles.cell, width: fundColumnWidths[3], fontWeight: 700, textAlign: "right" }}>Installments</Text>
                <Text style={{ ...styles.cell, width: fundColumnWidths[4], fontWeight: 700, textAlign: "right" }}>Rate</Text>
              </View>
              {report.fundBreakdowns.map((fund) => (
                <View key={fund.id} style={styles.tableRow}>
                  <Text style={{ ...styles.cell, width: fundColumnWidths[0] }}>{fund.fundName}</Text>
                  <Text style={{ ...styles.cell, width: fundColumnWidths[1], textAlign: "right" }}>
                    {formatMoney(fund.totalCollected)}
                  </Text>
                  <Text style={{ ...styles.cell, width: fundColumnWidths[2], textAlign: "right" }}>
                    {formatMoney(fund.fullPaymentSplit)}
                  </Text>
                  <Text style={{ ...styles.cell, width: fundColumnWidths[3], textAlign: "right" }}>
                    {formatMoney(fund.installmentSplit)}
                  </Text>
                  <Text style={{ ...styles.cell, width: fundColumnWidths[4], textAlign: "right" }}>
                    {fund.completionRate}%
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Installments</Text>
          {report.installments.length === 0 ? (
            <Text style={styles.emptyState}>No active installment plans for this year.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.cell, width: installmentColumnWidths[0], fontWeight: 700 }}>Member</Text>
                <Text style={{ ...styles.cell, width: installmentColumnWidths[1], fontWeight: 700 }}>Fund</Text>
                <Text style={{ ...styles.cell, width: installmentColumnWidths[2], fontWeight: 700, textAlign: "right" }}>Progress</Text>
                <Text style={{ ...styles.cell, width: installmentColumnWidths[3], fontWeight: 700, textAlign: "right" }}>Remaining</Text>
              </View>
              {report.installments.map((installment) => (
                <View key={installment.id} style={styles.tableRow}>
                  <Text style={{ ...styles.cell, width: installmentColumnWidths[0] }}>{installment.memberName}</Text>
                  <Text style={{ ...styles.cell, width: installmentColumnWidths[1] }}>{installment.fundName}</Text>
                  <Text style={{ ...styles.cell, width: installmentColumnWidths[2], textAlign: "right" }}>
                    {`${installment.paidSegments}/${installment.totalSegments}`}
                  </Text>
                  <Text style={{ ...styles.cell, width: installmentColumnWidths[3], textAlign: "right" }}>
                    {formatMoney(installment.remainingAmount)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Officer Log</Text>
          {report.officerLogs.length === 0 ? (
            <Text style={styles.emptyState}>No officer records available.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.cell, width: officerColumnWidths[0], fontWeight: 700 }}>Role</Text>
                <Text style={{ ...styles.cell, width: officerColumnWidths[1], fontWeight: 700 }}>Officer</Text>
                <Text style={{ ...styles.cell, width: officerColumnWidths[2], fontWeight: 700 }}>Term</Text>
                <Text style={{ ...styles.cell, width: officerColumnWidths[3], fontWeight: 700, textAlign: "right" }}>Status</Text>
              </View>
              {report.officerLogs.map((officer) => (
                <View key={officer.id} style={styles.tableRow}>
                  <Text style={{ ...styles.cell, width: officerColumnWidths[0] }}>{officer.role}</Text>
                  <Text style={{ ...styles.cell, width: officerColumnWidths[1] }}>{officer.officerName}</Text>
                  <Text style={{ ...styles.cell, width: officerColumnWidths[2] }}>
                    {`${officer.termStart} to ${officer.termEnd || "Present"}`}
                  </Text>
                  <Text style={{ ...styles.cell, width: officerColumnWidths[3], textAlign: "right" }}>
                    {officer.status}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
