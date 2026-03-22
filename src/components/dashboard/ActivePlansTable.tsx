import { ActivePlan } from "@/lib/api/dashboard";
import { Icon } from "@iconify/react";

export default function ActivePlansTable({ data }: { data: ActivePlan[] }) {
  return (
    <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-[#343434]">
          Active Installment Plans
        </h3>
        <button className="text-[13px] font-semibold text-[#a12124] transition-colors hover:text-[#8a1c1e]">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-[#F0ECEC]">
              <th className="pb-3 pr-4 font-semibold text-[#625f5f]">Member</th>
              <th className="pb-3 px-4 font-semibold text-[#625f5f]">Fund Type</th>
              <th className="pb-3 px-4 font-semibold text-[#625f5f]">Progress</th>
              <th className="pb-3 px-4 font-semibold text-[#625f5f]">Next Due</th>
              <th className="pb-3 px-4 font-semibold text-[#625f5f]">Status</th>
              <th className="pb-3 pl-4 font-semibold text-[#625f5f]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECEC]">
            {data.map((plan) => (
              <tr key={plan.id} className="group transition-colors hover:bg-[#F9F7F6]">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D0808]/5">
                      <span className="text-[11px] font-bold text-[#3D0808]">
                        {plan.memberInitials}
                      </span>
                    </div>
                    <span className="font-medium text-[#343434]">
                      {plan.memberName}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-[#625f5f]">{plan.fundType}</td>
                <td className="py-3.5 px-4 font-medium text-[#343434]">
                  {plan.progress}
                </td>
                <td className="py-3.5 px-4 text-[#625f5f]">{plan.nextDueDate}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      plan.status === "ONGOING"
                        ? "bg-amber-100 text-amber-700"
                        : plan.status === "OVERDUE"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {plan.status}
                  </span>
                </td>
                <td className="py-3.5 pl-4">
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#a12124]/10 px-3 py-1.5 text-[11px] font-bold text-[#a12124] transition-colors hover:bg-[#a12124]/20 opacity-0 group-hover:opacity-100">
                    <Icon icon="solar:bell-bing-bold" className="h-3.5 w-3.5" />
                    Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
