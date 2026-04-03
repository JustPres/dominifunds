import { DailyRosterRow, SectionProgressRow } from "@/lib/collection-scheduling";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function CollectionRosterPrintSheet({
  orgDisplayName,
  date,
  weekday,
  activePeriodName,
  sectionFilter,
  roster,
  sectionProgress,
}: {
  orgDisplayName: string;
  date: string;
  weekday: string;
  activePeriodName: string;
  sectionFilter: string;
  roster: DailyRosterRow[];
  sectionProgress: SectionProgressRow[];
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
                  <p className="text-sm text-white/90">Collection Day Roster</p>
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold">Scheduled Collection List</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Print-ready student roster for the selected collection day, including collectible balances and remarks space.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-white/85 md:text-right">
              <p><span className="font-semibold text-white">Organization:</span> {orgDisplayName}</p>
              <p><span className="font-semibold text-white">Collection Date:</span> {date} ({weekday})</p>
              <p><span className="font-semibold text-white">Period:</span> {activePeriodName}</p>
              <p><span className="font-semibold text-white">Section Filter:</span> {sectionFilter}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-8 py-8 print:px-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#d9cdc3] bg-[#f7f1ea] text-[#493735]">
                <th className="px-3 py-3 font-semibold">Student</th>
                <th className="px-3 py-3 font-semibold">Section</th>
                <th className="px-3 py-3 font-semibold">Payment Mode</th>
                <th className="px-3 py-3 font-semibold">Due Items</th>
                <th className="px-3 py-3 font-semibold">Amount Due</th>
                <th className="px-3 py-3 font-semibold">Latest Payment</th>
                <th className="px-3 py-3 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[#6d625f]">
                    No students are scheduled with collectible balances for this day.
                  </td>
                </tr>
              ) : (
                roster.map((row) => (
                  <tr key={row.memberId} className="border-b border-[#efe4da] align-top">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{row.memberName}</p>
                    </td>
                    <td className="px-3 py-3">{row.sectionName}</td>
                    <td className="px-3 py-3">{row.paymentMode}</td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {row.dueItems.map((item, index) => (
                          <p key={`${row.memberId}-${index}`}>
                            {item.fundName}: {item.kind === "INSTALLMENT" ? item.installmentInfo : "Full payment"}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#8f1c20]">{currencyFormatter.format(row.amountDue)}</td>
                    <td className="px-3 py-3">{row.latestPaymentDate || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="h-10 rounded-lg border border-dashed border-[#d9cdc3]" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div>
            <h2 className="font-display text-xl font-bold text-[#2f2726]">Section Progress Snapshot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {sectionProgress.map((section) => (
                <div key={section.sectionId ?? section.sectionName} className="rounded-2xl border border-[#efe4da] bg-[#fffcfa] p-4">
                  <p className="font-semibold text-[#2f2726]">{section.sectionName}</p>
                  <p className="mt-2 text-sm text-[#6b605d]">
                    {section.fullyPaidMembers} of {section.totalMembers} fully paid
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-[#8f1c20]">{section.completionRate}%</p>
                  <p className="text-sm text-[#6b605d]">{currencyFormatter.format(section.outstandingAmount)} outstanding</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
