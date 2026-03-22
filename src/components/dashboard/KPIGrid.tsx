import { KPIMetrics } from "@/lib/api/dashboard";
import { Icon } from "@iconify/react";

export default function KPIGrid({ data }: { data: KPIMetrics }) {
  const cards = [
    {
      title: "Total Collected",
      value: `₱${data.totalCollected.toLocaleString()}`,
      sub: "Sum of all paid transactions",
      icon: "solar:wallet-money-bold-duotone",
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-t-emerald-500",
    },
    {
      title: "Active Plans",
      value: data.activePlans.toLocaleString(),
      sub: "Ongoing installments",
      icon: "solar:calendar-date-bold-duotone",
      colorClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
      borderClass: "border-t-amber-500",
    },
    {
      title: "Overdue",
      value: data.overdueInstallments.toLocaleString(),
      sub: "Missed payments",
      icon: "solar:danger-triangle-bold-duotone",
      colorClass: "text-red-500",
      bgClass: "bg-red-500/10",
      borderClass: "border-t-[#a12124]",
    },
    {
      title: "Fully Paid",
      value: data.fullyPaidMembers.toLocaleString(),
      sub: "Cleared members",
      icon: "solar:check-circle-bold-duotone",
      colorClass: "text-purple-500",
      bgClass: "bg-purple-500/10",
      borderClass: "border-t-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-2xl border border-[#F0ECEC] border-t-[3px] bg-white p-5 shadow-sm transition-all hover:shadow-md ${card.borderClass}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#625f5f]/70 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold text-[#343434]">
                {card.value}
              </h3>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgClass}`}>
              <Icon icon={card.icon} className={`h-6 w-6 ${card.colorClass}`} />
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-[#625f5f]/60">
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
