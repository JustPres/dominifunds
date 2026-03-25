"use client";

import { format } from "date-fns";
import {
  CalendarClock,
  CreditCard,
  Landmark,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type {
  PortalInstallmentPlan,
  PortalObligation,
  PortalOverview,
  PortalSecuritySummary,
  PortalTransaction,
} from "@/lib/api/portal";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function PortalOverviewPanel({ overview }: { overview: PortalOverview }) {
  return (
    <section className="rounded-[28px] border border-[#eadfd9] bg-white/92 p-6 shadow-[0_18px_32px_rgba(35,26,26,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">Overview</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">Your current standing</h3>
        </div>
        <div className="rounded-full border border-[#f1dfd8] bg-[#fff7f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8f1c20]">
          {overview.standing.replace("_", " ")}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Balance due"
          value={currencyFormatter.format(overview.balanceDue)}
          tone="danger"
        />
        <StatCard
          icon={<Landmark className="h-4 w-4" />}
          label="Required dues"
          value={currencyFormatter.format(overview.totalRequired)}
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Latest payment"
          value={
            overview.latestPayment
              ? currencyFormatter.format(overview.latestPayment.amount)
              : "No payment yet"
          }
          description={
            overview.latestPayment
              ? `${overview.latestPayment.fundName} • ${format(new Date(overview.latestPayment.date), "MMM dd, yyyy")}`
              : "No transaction recorded yet"
          }
        />
        <StatCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Next due date"
          value={overview.nextDueDate ? format(new Date(overview.nextDueDate), "MMM dd, yyyy") : "Nothing pending"}
          description={
            overview.nextDueAmount ? currencyFormatter.format(overview.nextDueAmount) : "No open installment due"
          }
        />
      </div>
    </section>
  );
}

export function PortalInstallmentsSection({ plans }: { plans: PortalInstallmentPlan[] }) {
  if (plans.length === 0) {
    return (
      <EmptyCard
        eyebrow="Installments"
        title="No active installment plans"
        description="Any approved installment schedules will appear here with progress, due dates, and current balance."
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">Installments</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">Your installment plans</h3>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const progress = plan.totalSegments > 0 ? (plan.paidSegments / plan.totalSegments) * 100 : 0;

          return (
            <article
              key={plan.id}
              className="overflow-hidden rounded-[28px] border border-[#eadfd9] bg-white/92 shadow-[0_18px_32px_rgba(35,26,26,0.06)]"
            >
              <div className="border-b border-[#f2e5df] px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#9f8d86]">{plan.status}</p>
                    <h4 className="mt-2 text-xl font-semibold text-[#241a1a]">{plan.fundName}</h4>
                    <p className="mt-1 text-sm text-[#6f5d59]">
                      {plan.paidSegments} of {plan.totalSegments} installments paid
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-[#f1dfd8] bg-[#fffaf7] px-4 py-3 text-left sm:min-w-[190px] sm:text-right">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#9f8d86]">Remaining</p>
                    <p className="mt-2 text-xl font-semibold text-[#8f1c20]">
                      {currencyFormatter.format(plan.remainingAmount)}
                    </p>
                    <p className="mt-1 text-xs text-[#6f5d59]">
                      {plan.nextDueDate
                        ? `Next due ${format(new Date(plan.nextDueDate), "MMM dd, yyyy")}`
                        : "No remaining installments"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#6f5d59]">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#f3ebe7]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,#8f1c20_0%,#c24439_100%)] transition-[width] duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#f2e5df]">
                {plan.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#241a1a]">
                        Installment {entry.installmentNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#6f5d59]">
                        Due {format(new Date(entry.dueDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#241a1a]">{currencyFormatter.format(entry.amount)}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEntryStatusClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PortalPaymentHistorySection({ history }: { history: PortalTransaction[] }) {
  if (history.length === 0) {
    return (
      <EmptyCard
        eyebrow="Payments"
        title="No payment history yet"
        description="Completed full payments and installment payments will appear here once your organization records them."
      />
    );
  }

  return (
    <section className="rounded-[28px] border border-[#eadfd9] bg-white/92 p-6 shadow-[0_18px_32px_rgba(35,26,26,0.06)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">Payments</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">Recent payment history</h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {history.map((transaction) => (
          <div
            key={transaction.id}
            className="flex flex-col gap-3 rounded-[22px] border border-[#f1e3dc] bg-[#fffdfa] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#241a1a]">{transaction.fundName}</p>
              <p className="text-xs text-[#6f5d59]">
                {format(new Date(transaction.date), "MMM dd, yyyy")} • {transaction.type.replace("_", " ")}
              </p>
              {transaction.note ? <p className="text-xs text-[#8a7771]">{transaction.note}</p> : null}
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEntryStatusClass(transaction.status)}`}>
                {transaction.status}
              </span>
              <p className="text-sm font-semibold text-[#241a1a]">{currencyFormatter.format(transaction.amount)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PortalObligationsPanel({ obligations }: { obligations: PortalObligation[] }) {
  return (
    <section className="rounded-[28px] border border-[#eadfd9] bg-white/92 p-6 shadow-[0_18px_32px_rgba(35,26,26,0.06)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">Obligations</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">Required organization dues</h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {obligations.length === 0 ? (
          <p className="text-sm text-[#6f5d59]">No active fund obligations are assigned to your organization.</p>
        ) : (
          obligations.map((obligation) => (
            <div
              key={obligation.id}
              className="rounded-[22px] border border-[#f1e3dc] bg-[#fffdfa] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#241a1a]">{obligation.fundName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#9f8d86]">
                    {obligation.frequency.replaceAll("_", " ")}
                  </p>
                  {obligation.description ? (
                    <p className="mt-2 text-xs leading-5 text-[#6f5d59]">{obligation.description}</p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[#8f1c20]">{currencyFormatter.format(obligation.amount)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-[#f7efea] px-2.5 py-1 text-[11px] font-semibold text-[#6f5d59]">
                  {obligation.required ? "Required" : "Optional"}
                </span>
                {obligation.allowInstallment ? (
                  <span className="inline-flex rounded-full bg-[#eaf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2360aa]">
                    Installment available
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function PortalSecurityPanel({ security }: { security: PortalSecuritySummary | null }) {
  return (
    <section className="rounded-[28px] border border-[#eadfd9] bg-white/92 p-6 shadow-[0_18px_32px_rgba(35,26,26,0.06)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">Security</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">Recent account activity</h3>
        </div>
        <div className="rounded-full border border-[#f1e3dc] bg-[#fff7f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8f1c20]">
          Protected
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[22px] border border-[#f1e3dc] bg-[#fffdfa] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8f1c20]/10 text-[#8f1c20]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#241a1a]">{security?.currentDevice.label || "Current device"}</p>
              <p className="mt-1 text-xs text-[#6f5d59]">
                {security?.currentDevice.trusted
                  ? `Trusted until ${format(new Date(security.currentDevice.expiresAt || Date.now()), "MMM dd, yyyy")}`
                  : "Verification may be required on this device."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(security?.recentActivity ?? []).slice(0, 4).map((event) => (
            <div key={event.id} className="rounded-[22px] border border-[#f1e3dc] bg-[#fffdfa] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#241a1a]">{formatEventStatus(event.status)}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6f5d59]">
                    {event.detail || event.deviceLabel || "Recent account activity"}
                  </p>
                </div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9f8d86]">
                  {format(new Date(event.createdAt), "MMM dd")}
                </p>
              </div>
            </div>
          ))}

          {!security?.recentActivity?.length ? (
            <p className="text-sm text-[#6f5d59]">Recent login events will appear here after you start using the portal.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className={`rounded-[22px] border p-4 ${tone === "danger" ? "border-[#f3d4cc] bg-[#fff7f5]" : "border-[#f1e3dc] bg-[#fffdfa]"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#9f8d86]">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone === "danger" ? "bg-[#8f1c20]/10 text-[#8f1c20]" : "bg-[#f7efea] text-[#6f5d59]"}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-xl font-semibold tracking-[-0.03em] ${tone === "danger" ? "text-[#8f1c20]" : "text-[#241a1a]"}`}>
        {value}
      </p>
      {description ? <p className="mt-1 text-xs leading-5 text-[#6f5d59]">{description}</p> : null}
    </div>
  );
}

function EmptyCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[28px] border border-dashed border-[#eadfd9] bg-white/85 p-8 text-center shadow-[0_18px_32px_rgba(35,26,26,0.04)]">
      <p className="text-[11px] uppercase tracking-[0.26em] text-[#9f8d86]">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#241a1a]">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6f5d59]">{description}</p>
    </section>
  );
}

function getEntryStatusClass(status: string) {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "OVERDUE") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

function formatEventStatus(status: string) {
  if (status === "SUCCEEDED") return "Successful login";
  if (status === "OTP_FAILED") return "Verification failed";
  if (status === "OTP_SENT") return "Verification requested";
  if (status === "PASSWORD_FAILED") return "Failed password attempt";
  if (status === "SIGNED_OUT") return "Signed out";
  return "Account activity";
}
