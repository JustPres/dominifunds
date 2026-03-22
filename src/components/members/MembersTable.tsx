import { Member } from "@/lib/api/members";
import { Icon } from "@iconify/react";

export default function MembersTable({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#F0ECEC] bg-white p-8 text-center shadow-sm">
        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="mb-4 h-16 w-16 text-[#F0ECEC]" />
        <h3 className="font-display text-xl font-bold text-[#343434]">No members found</h3>
        <p className="mt-2 text-sm text-[#625f5f]">Try adjusting your search filters or add a new member.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F0ECEC] bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC] bg-[#F9F7F6]/50">
              <th className="py-4 pl-6 pr-4 font-semibold text-[#625f5f]">Member</th>
              <th className="py-4 px-4 font-semibold text-[#625f5f]">Role</th>
              <th className="py-4 px-4 font-semibold text-[#625f5f]">Year</th>
              <th className="py-4 px-4 font-semibold text-[#625f5f] text-right">Total Paid</th>
              <th className="py-4 px-4 font-semibold text-[#625f5f] text-center">Active Plans</th>
              <th className="py-4 px-4 font-semibold text-[#625f5f] text-right">Balance Due</th>
              <th className="py-4 pl-4 pr-6 font-semibold text-[#625f5f]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {members.map((member) => {
              const getInitials = (name: string) =>
                name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

              return (
                <tr key={member.id} className="transition-colors hover:bg-[#F9F7F6]">
                  {/* Member Cell */}
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/5">
                        <span className="text-xs font-bold text-[#3D0808]">
                          {getInitials(member.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#343434]">{member.name}</p>
                        <p className="text-[11px] text-[#625f5f]">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      member.role === "Member" ? "bg-slate-100 text-slate-600" : "bg-purple-100 text-purple-700"
                    }`}>
                      {member.role}
                    </span>
                  </td>

                  {/* Year Level */}
                  <td className="py-4 px-4 text-[#625f5f] font-medium">
                    {member.yearLevel}
                  </td>

                  {/* Total Paid */}
                  <td className="py-4 px-4 text-right">
                    <span className="font-display text-[15px] font-bold text-emerald-600">
                      ₱{member.totalPaid.toLocaleString()}
                    </span>
                  </td>

                  {/* Active Plans */}
                  <td className="py-4 px-4 text-center">
                    {member.activeInstallmentPlans > 0 ? (
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-amber-100 px-1.5 text-xs font-bold text-amber-700">
                        {member.activeInstallmentPlans}
                      </span>
                    ) : (
                      <span className="text-[#625f5f]/40">—</span>
                    )}
                  </td>

                  {/* Balance Due */}
                  <td className="py-4 px-4 text-right">
                    {member.balanceDue > 0 ? (
                      <span className="font-display text-[15px] font-bold text-[#a12124]">
                        ₱{member.balanceDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[#625f5f]/40 font-display text-[15px]">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 pl-4 pr-6">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        member.status === "Good Standing"
                          ? "bg-emerald-100 text-emerald-700"
                          : member.status === "Has Installment Plan"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.status}
                    </span>
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
