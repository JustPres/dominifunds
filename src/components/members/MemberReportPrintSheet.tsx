import {
  MemberReportData,
  MEMBER_REPORT_PRINT_COLUMNS,
  getMemberReportColumnValue,
} from "@/lib/member-report";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

function formatCell(value: string | number, kind?: "text" | "currency" | "date" | "number") {
  if (kind === "currency" && typeof value === "number") {
    return currencyFormatter.format(value);
  }

  if (value === "") {
    return "-";
  }

  return String(value);
}

function formatGeneratedDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MemberReportPrintSheet({
  orgDisplayName,
  report,
}: {
  orgDisplayName: string;
  report: MemberReportData;
}) {
  return (
    <div className="min-h-screen bg-[#f4efe8] px-6 py-8 text-[#241f1f] print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-[#d8cec4] bg-white shadow-[0_24px_80px_rgba(70,35,22,0.08)] print:max-w-none print:rounded-none print:border-none print:shadow-none">
        <div className="border-b border-[#eadfd5] bg-[linear-gradient(135deg,#5c1313_0%,#902727_55%,#d07a46_100%)] px-8 py-8 text-white print:px-0">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-sm font-bold tracking-[0.3em]">
                  DF
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">DominiFunds</p>
                  <p className="text-sm text-white/90">Officer Reporting Suite</p>
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold">Members Payment Standing Report</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Branded roster of student payment standing, installment activity, overdue balances, and recent collections.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-white/85 md:text-right">
              <p><span className="font-semibold text-white">Organization:</span> {orgDisplayName}</p>
              <p><span className="font-semibold text-white">Generated:</span> {formatGeneratedDate(report.generatedAt)}</p>
              <p><span className="font-semibold text-white">Search:</span> {report.filters.search || "None"}</p>
              <p><span className="font-semibold text-white">Status:</span> {report.filters.status}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 print:px-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#d9cdc3] bg-[#f7f1ea] text-[#493735]">
                {MEMBER_REPORT_PRINT_COLUMNS.map((column) => (
                  <th key={column.key} className="px-3 py-3 font-semibold">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={MEMBER_REPORT_PRINT_COLUMNS.length} className="px-3 py-8 text-center text-[#6d625f]">
                    No members matched the selected filters.
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#efe4da] align-top">
                    {MEMBER_REPORT_PRINT_COLUMNS.map((column) => {
                      const value = getMemberReportColumnValue(row, column.key);

                      return (
                        <td key={column.key} className="px-3 py-3 text-[#2f2726]">
                          {column.key === "student" ? (
                            <div>
                              <p className="font-semibold">{row.name}</p>
                              <p className="text-xs text-[#6d625f]">{row.email}</p>
                            </div>
                          ) : (
                            formatCell(value, column.kind)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
