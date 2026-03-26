import { OverdueMember, RecentChange, RecentPayment } from "@/lib/api/dashboard";
import { Icon } from "@iconify/react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default function RightSideMetrics({
  overdue,
  recent,
  changes,
}: {
  overdue: OverdueMember[];
  recent: RecentPayment[];
  changes: RecentChange[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold" className="h-5 w-5 text-red-500" />
            <h3 className="font-display text-base font-bold text-red-900">Needs Attention</h3>
          </div>
          <span className="flex h-5 items-center justify-center rounded-full bg-red-200 px-2 text-[10px] font-bold text-red-800">
            {overdue.length}
          </span>
        </div>

        <div className="space-y-3">
          {overdue.map((member) => (
            <div
              key={member.id}
              className="group flex items-center justify-between rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow"
            >
              <div>
                <p className="text-[13px] font-bold text-[#343434]">{member.name}</p>
                <p className="text-[11px] font-medium text-red-600">
                  Owes {currencyFormatter.format(member.amount)}
                </p>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100">
                <Icon icon="solar:bell-bing-bold" className="h-[18px] w-[18px]" />
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full rounded-lg bg-red-100 py-2.5 text-[13px] font-bold text-red-700 transition-colors hover:bg-red-200">
          Send Master Reminder
        </button>
      </div>

      <div className="rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-display text-base font-bold text-[#343434]">Recent Full Payments</h3>
          <p className="text-xs text-[#625f5f]">Last 5 transactions completed</p>
        </div>

        <div className="space-y-4">
          {recent.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                  <Icon icon="solar:round-transfer-horizontal-bold" className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#343434]">{payment.memberName}</p>
                  <p className="text-[10px] font-medium text-[#625f5f]/70">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(new Date(payment.date))}
                  </p>
                </div>
              </div>
              <p className="text-[13px] font-bold text-emerald-600">
                +{currencyFormatter.format(payment.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-display text-base font-bold text-[#343434]">Recent Changes</h3>
          <p className="text-xs text-[#625f5f]">Latest edits, deletions, and recorded collections</p>
        </div>

        <div className="space-y-4">
          {changes.length === 0 ? (
            <p className="text-sm text-[#625f5f]">No recent changes logged yet.</p>
          ) : (
            changes.map((change) => (
              <div key={change.id} className="rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8f1c20]">
                      {change.action.replaceAll("_", " ")}
                    </p>
                    <p className="text-[13px] font-semibold text-[#343434]">
                      {change.entityType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#625f5f]">
                    {new Intl.DateTimeFormat("en-PH", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(change.createdAt))}
                  </p>
                </div>
                <p className="mt-2 text-[12px] text-[#625f5f]">{change.note || "No note provided."}</p>
                <p className="mt-1 text-[11px] text-[#8d7a73]">By {change.actorName}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
