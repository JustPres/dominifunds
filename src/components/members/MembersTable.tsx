import { Member } from "@/lib/api/members";
import { Icon } from "@iconify/react";
import AddMemberDialog from "./AddMemberDialog";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStandingClasses(status: Member["overallStatus"]) {
  if (status === "Fully Paid") return "bg-emerald-100 text-emerald-700";
  if (status === "On Installment") return "bg-amber-100 text-amber-700";
  if (status === "Overdue") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export default function MembersTable({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="mb-4 h-16 w-16 text-[#625f5f]/40" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No members added yet.</h3>
        <p className="mt-2 text-sm text-[#625f5f]">Start by adding members to track their funds.</p>
        <div className="mt-6">
          <AddMemberDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0ECEC] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50">
              <th className="py-4 pl-6 pr-4 font-semibold text-[#625f5f]">Member</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Section</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Role</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Standing</th>
              <th className="px-4 py-4 font-semibold text-[#625f5f]">Recent Payment</th>
              <th className="px-4 py-4 text-right font-semibold text-[#625f5f]">Total Paid</th>
              <th className="px-4 py-4 text-center font-semibold text-[#625f5f]">Active Plans</th>
              <th className="px-4 py-4 text-right font-semibold text-[#625f5f]">Balance Due</th>
              <th className="py-4 pl-4 pr-6 font-semibold text-[#625f5f]">Alerts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {members.map((member) => {
              const initials = member.name
                .split(" ")
                .map((namePart) => namePart[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              const hasAlerts = member.overdueEntries > 0 || member.overdueTransactions > 0;

              return (
                <tr key={member.id} className="transition-colors hover:bg-[#F9F7F6]">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/5">
                        <span className="text-xs font-bold text-[#3D0808]">{initials}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#343434]">{member.name}</p>
                        <p className="text-[11px] text-[#625f5f]">{member.email}</p>
                        <p className="text-[11px] text-[#625f5f]/80">{member.yearLevel}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-[#F9F7F6] px-2.5 py-1 text-[11px] font-semibold text-[#625f5f]">
                      {member.sectionName || "Unassigned"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        member.role === "Member" ? "bg-slate-100 text-slate-600" : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStandingClasses(member.overallStatus)}`}
                      >
                        {member.overallStatus}
                      </span>
                      <span className="text-[11px] text-[#625f5f]">{member.paymentMode}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {member.recentPaymentDate ? (
                      <div className="space-y-1">
                        <p className="font-medium text-[#343434]">{formatDate(member.recentPaymentDate)}</p>
                        <p className="text-[11px] text-[#625f5f]">
                          {member.recentPaymentType.replaceAll("_", " ").toLowerCase()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[#625f5f]/40">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="font-display text-[15px] font-bold text-emerald-600">
                      {formatCurrency(member.totalPaid)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    {member.activeInstallmentPlans > 0 ? (
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-amber-100 px-1.5 text-xs font-bold text-amber-700">
                        {member.activeInstallmentPlans}
                      </span>
                    ) : (
                      <span className="text-[#625f5f]/40">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {member.balanceDue > 0 ? (
                      <span className="font-display text-[15px] font-bold text-[#a12124]">
                        {formatCurrency(member.balanceDue)}
                      </span>
                    ) : (
                      <span className="font-display text-[15px] text-[#625f5f]/40">-</span>
                    )}
                  </td>

                  <td className="py-4 pl-4 pr-6">
                    {hasAlerts ? (
                      <div className="space-y-1 text-[11px] font-medium text-[#a12124]">
                        {member.overdueEntries > 0 ? <p>{member.overdueEntries} overdue installments</p> : null}
                        {member.overdueTransactions > 0 ? <p>{member.overdueTransactions} overdue records</p> : null}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Clear
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
