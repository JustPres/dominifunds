"use client";

import { format } from "date-fns";
import { Session } from "next-auth";
import { CircleAlert, CircleCheckBig, CreditCard, Landmark, WalletCards } from "lucide-react";
import { formatYearLevelLabel } from "@/lib/member-fields";
import type { PortalOverview, PortalSecuritySummary } from "@/lib/api/portal";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function PortalProfileBanner({
  session,
  overview,
  securitySummary,
  orgDisplayName,
}: {
  session: Session | null;
  overview: PortalOverview;
  securitySummary: PortalSecuritySummary | null;
  orgDisplayName: string;
}) {
  const profileName = session?.user?.name || "Student";
  const email = session?.user?.email || "";
  const yearLevel = formatYearLevelLabel(session?.user?.yearLevel, "Member");
  const lastLoginAt = securitySummary?.lastLoginAt || session?.user?.lastLoginAt || null;
  const standing = getStandingMeta(overview.standing);

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#f1dfd8] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_28%),linear-gradient(140deg,#8f1c20_0%,#b7302f_52%,#d68c52_100%)] p-6 text-white shadow-[0_24px_60px_rgba(143,28,32,0.16)] sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
              Student finance overview
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${standing.className}`}
            >
              <standing.Icon className="h-3.5 w-3.5" />
              {standing.label}
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              {overview.balanceDue > 0
                ? `You still have ${currencyFormatter.format(overview.balanceDue)} to clear.`
                : "Your current balances are cleared."}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              Track your organization dues, upcoming installments, and recent payments from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/88">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">{email}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">{yearLevel}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
              {orgDisplayName}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">Account</p>
            <p className="mt-3 text-xl font-semibold">{profileName}</p>
            <p className="mt-1 text-sm text-white/78">
              {lastLoginAt
                ? `Last login ${format(new Date(lastLoginAt), "MMM dd, yyyy • hh:mm a")}`
                : "No recent login recorded yet."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <MetricCard
              label="Balance due"
              value={currencyFormatter.format(overview.balanceDue)}
              icon={<WalletCards className="h-4 w-4" />}
            />
            <MetricCard
              label="Total paid"
              value={currencyFormatter.format(overview.totalPaid)}
              icon={<Landmark className="h-4 w-4" />}
            />
            <MetricCard
              label="Next due"
              value={
                overview.nextDueDate
                  ? `${currencyFormatter.format(overview.nextDueAmount ?? 0)}`
                  : "No due date"
              }
              subtext={overview.nextDueDate ? format(new Date(overview.nextDueDate), "MMM dd, yyyy") : undefined}
              icon={<CreditCard className="h-4 w-4" />}
            />
            <MetricCard
              label="Active plans"
              value={String(overview.activeInstallmentPlans)}
              subtext={overview.overdueCount > 0 ? `${overview.overdueCount} overdue item(s)` : "No overdue entries"}
              icon={<CircleAlert className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 text-white/78">
        <p className="text-[11px] uppercase tracking-[0.24em]">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/12">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-white/72">{subtext}</p> : null}
    </div>
  );
}

function getStandingMeta(standing: PortalOverview["standing"]) {
  if (standing === "OVERDUE") {
    return {
      label: "Overdue",
      className: "border-red-200/60 bg-red-50/95 text-red-700",
      Icon: CircleAlert,
    };
  }

  if (standing === "INSTALLMENT_ACTIVE") {
    return {
      label: "Installment active",
      className: "border-amber-200/60 bg-amber-50/95 text-amber-700",
      Icon: CircleAlert,
    };
  }

  return {
    label: "Up to date",
    className: "border-emerald-200/60 bg-emerald-50/95 text-emerald-700",
    Icon: CircleCheckBig,
  };
}
