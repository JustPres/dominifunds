"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCollectionRoster,
  getMonthlyDues,
  openCollectionRosterPrint,
  sendReminder,
} from "@/lib/api/calendar";
import { createCollectionPeriod, createCollectionSchedule } from "@/lib/api/collection-config";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardCalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sectionId, setSectionId] = useState("ALL");
  const [periodForm, setPeriodForm] = useState({
    name: "Current Semester",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), 5, 30).toISOString().split("T")[0],
  });
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>([1, 4]);
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;
  const canManage = session?.user?.role === "OFFICER" && session.user.officerAccessRole !== "PRESIDENT";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-dues", orgId, currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getMonthlyDues(orgId as string, currentMonth.getMonth() + 1, currentMonth.getFullYear()),
    enabled: !!orgId,
  });

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const { data: rosterData, isLoading: isRosterLoading } = useQuery({
    queryKey: ["collection-roster", orgId, selectedDateString, sectionId],
    queryFn: () => getCollectionRoster(orgId as string, selectedDateString, sectionId),
    enabled: !!orgId,
  });

  const remindMutation = useMutation({
    mutationFn: sendReminder,
    onSuccess: () => {
      toast.success("Reminder sent successfully.");
    },
    onError: () => {
      toast.error("Unable to send reminder.");
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: () =>
      createCollectionPeriod(orgId as string, {
        ...periodForm,
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-dues", orgId] });
      queryClient.invalidateQueries({ queryKey: ["collection-roster", orgId] });
      toast.success("Collection period created.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to create collection period.");
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: () =>
      createCollectionSchedule(orgId as string, {
        collectionPeriodId: data?.activePeriod?.id as string,
        weekdays: scheduleWeekdays,
        name: "Default Collection Schedule",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-dues", orgId] });
      queryClient.invalidateQueries({ queryKey: ["collection-roster", orgId] });
      toast.success("Default collection schedule saved.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to save collection schedule.");
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const scheduleSummary = useMemo(() => {
    if (!data?.schedules.length) return [];

    return data.schedules.map((schedule) => ({
      ...schedule,
      weekdayLabel: schedule.weekdays
        .map((weekday) => WEEKDAY_LABELS[weekday] ?? weekday)
        .join(", "),
    }));
  }, [data?.schedules]);

  return (
    <div className="flex flex-col gap-6 pb-6 font-body">
      <div className="flex flex-col gap-4 rounded-[28px] border border-[#eadfd9] bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8d5f53]">Collection Planner</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#2f2726]">Scheduled Collection Calendar</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6b605d]">
            Track recurring collection days, print the roster for a selected date, and monitor section progress inside the active collection period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            className="h-11 rounded-xl border border-[#eadfd9] bg-[#fffdfb] px-3 text-sm font-medium text-[#2f2726] outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
          >
            <option value="ALL">All Sections</option>
            {(rosterData?.sections ?? []).map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!orgId}
            onClick={() => orgId && openCollectionRosterPrint(orgId, selectedDateString, sectionId)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-sm font-bold text-[#2f2726] shadow-sm transition-colors hover:bg-[#fbf6f3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon icon="solar:printer-bold" className="h-5 w-5 text-[#8f1c20]" />
            Print selected day
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard
          label="Scheduled Days"
          value={data?.summary.scheduledDaysCount ?? 0}
          icon="solar:calendar-bold"
          tone="rose"
        />
        <MetricCard
          label="Installment Collections"
          value={data?.summary.installmentCount ?? 0}
          icon="solar:card-transfer-bold"
          tone="amber"
        />
        <MetricCard
          label="Full Payment Collections"
          value={data?.summary.fullPaymentsCount ?? 0}
          icon="solar:wallet-money-bold"
          tone="blue"
        />
        <MetricCard
          label="Fully Current Members"
          value={data?.summary.fullyCurrentMembers ?? 0}
          icon="solar:check-circle-bold"
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border border-[#eadfd9] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-[#2f2726]">{format(currentMonth, "MMMM yyyy")}</h3>
              <p className="mt-1 text-sm text-[#6b605d]">
                {data?.activePeriod
                  ? `${data.activePeriod.name} • ${data.activePeriod.startDate} to ${data.activePeriod.endDate}`
                  : "No active collection period configured yet."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd9] text-[#625f5f] transition-colors hover:bg-[#fbf6f3]"
              >
                <Icon icon="solar:alt-arrow-left-bold" className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd9] text-[#625f5f] transition-colors hover:bg-[#fbf6f3]"
              >
                <Icon icon="solar:alt-arrow-right-bold" className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-3">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#8d7a73]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {isLoading ? (
              <div className="col-span-7 flex h-[420px] items-center justify-center text-[#6b605d]">
                Loading schedule...
              </div>
            ) : (
              calendarDays.map((day) => {
                const dateString = format(day, "yyyy-MM-dd");
                const duesForDay = data?.duesByDate?.[dateString];
                const totalDue =
                  duesForDay?.items.reduce((sum, item) => sum + Number(item.amountDue ?? 0), 0) ?? 0;
                const isSelected = isSameDay(day, selectedDate);
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dateString}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[100px] rounded-2xl border p-3 text-left transition-all ${
                      inMonth
                        ? "border-[#eadfd9] bg-white hover:border-[#a12124]/35 hover:shadow-sm"
                        : "border-transparent bg-[#f8f3ef] text-[#b8aca7]"
                    } ${isSelected ? "border-[#a12124] bg-[#fff5f3] shadow-[0_14px_30px_rgba(161,33,36,0.12)]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-display text-lg font-bold ${
                          isSelected ? "text-[#8f1c20]" : inMonth ? "text-[#2f2726]" : "text-[#b8aca7]"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {isToday(day) ? (
                        <span className="rounded-full bg-[#2f2726] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                          Today
                        </span>
                      ) : null}
                    </div>

                    {duesForDay ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-[#6b605d]">{duesForDay.items.length} collectible item(s)</p>
                        <p className="font-display text-sm font-bold text-[#a12124]">
                          {currencyFormatter.format(totalDue)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-8 text-xs text-[#b8aca7]">No roster</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[28px] border border-[#eadfd9] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8d5f53]">Daily Roster</p>
                <h3 className="mt-2 font-display text-xl font-bold text-[#2f2726]">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                <p className="mt-1 text-sm text-[#6b605d]">{rosterData?.weekday || format(selectedDate, "EEEE")}</p>
              </div>
              <span className="rounded-full bg-[#f7ede8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f1c20]">
                {rosterData?.roster.length ?? 0} students
              </span>
            </div>

            {isRosterLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : rosterData?.roster.length ? (
              <div className="space-y-3">
                {rosterData.roster.map((row) => (
                  <div key={row.memberId} className="rounded-2xl border border-[#efe4de] bg-[#fffcfa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2f2726]">{row.memberName}</p>
                        <p className="text-xs text-[#6b605d]">{row.sectionName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-base font-bold text-[#8f1c20]">
                          {currencyFormatter.format(row.amountDue)}
                        </p>
                        <p className="text-[11px] text-[#6b605d]">{row.paymentMode}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {row.dueItems.map((item, index) => (
                        <div key={`${row.memberId}-${index}`} className="rounded-xl bg-[#f7f1ec] px-3 py-2 text-xs text-[#4d403c]">
                          <p className="font-semibold">{item.fundName}</p>
                          <p>
                            {item.kind === "INSTALLMENT" ? item.installmentInfo : "Full payment"} • {currencyFormatter.format(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-[#6b605d]">
                        Last payment: {row.latestPaymentDate || "No payment yet"}
                      </p>
                      <button
                        type="button"
                        onClick={() => remindMutation.mutate(row.memberId)}
                        disabled={remindMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#eadfd9] bg-white px-3 py-1.5 text-xs font-bold text-[#2f2726] hover:bg-[#fbf6f3] disabled:opacity-50"
                      >
                        <Icon icon="solar:bell-bing-bold" className="h-4 w-4 text-[#8f1c20]" />
                        Send reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#eadfd9] bg-[#fffcfa] px-4 py-8 text-center text-sm text-[#6b605d]">
                No students are scheduled with collectible balances for this day.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#eadfd9] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8d5f53]">Recurring Schedules</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[#2f2726]">Collection Rhythm</h3>
            </div>
            <div className="space-y-3">
              {scheduleSummary.length ? (
                scheduleSummary.map((schedule) => (
                  <div key={schedule.id} className="rounded-2xl border border-[#efe4de] bg-[#fffcfa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2f2726]">{schedule.name || (schedule.scope === "ORG_DEFAULT" ? "Org default" : schedule.memberName)}</p>
                        <p className="text-xs text-[#6b605d]">{schedule.weekdayLabel}</p>
                      </div>
                      <span className="rounded-full bg-[#f7ede8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f1c20]">
                        {schedule.scope === "ORG_DEFAULT" ? "Default" : "Override"}
                      </span>
                    </div>
                    {schedule.note ? <p className="mt-2 text-xs text-[#6b605d]">{schedule.note}</p> : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[#eadfd9] bg-[#fffcfa] px-4 py-6 text-sm text-[#6b605d]">
                  No recurring collection schedules configured yet.
                </p>
              )}
            </div>

            {canManage ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#eadfd9] bg-[#fffcfa] p-4">
                {!data?.activePeriod ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#2f2726]">Create an active collection period</p>
                    <input
                      value={periodForm.name}
                      onChange={(event) => setPeriodForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Semester or collection period name"
                      className="flex h-10 w-full rounded-lg border border-[#eadfd9] bg-white px-3 py-2 text-sm outline-none focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={periodForm.startDate}
                        onChange={(event) => setPeriodForm((current) => ({ ...current, startDate: event.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-[#eadfd9] bg-white px-3 py-2 text-sm outline-none focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                      />
                      <input
                        type="date"
                        value={periodForm.endDate}
                        onChange={(event) => setPeriodForm((current) => ({ ...current, endDate: event.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-[#eadfd9] bg-white px-3 py-2 text-sm outline-none focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => createPeriodMutation.mutate()}
                      disabled={createPeriodMutation.isPending || !periodForm.name.trim()}
                      className="rounded-xl bg-[#8f1c20] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {createPeriodMutation.isPending ? "Creating..." : "Create active period"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#2f2726]">Set default collection weekdays</p>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_LABELS.map((label, index) => {
                        const selected = scheduleWeekdays.includes(index);

                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              setScheduleWeekdays((current) =>
                                current.includes(index)
                                  ? current.filter((value) => value !== index)
                                  : [...current, index].sort((left, right) => left - right)
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                              selected
                                ? "bg-[#8f1c20] text-white"
                                : "border border-[#eadfd9] bg-white text-[#625f5f]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => createScheduleMutation.mutate()}
                      disabled={createScheduleMutation.isPending || scheduleWeekdays.length === 0}
                      className="rounded-xl bg-[#8f1c20] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {createScheduleMutation.isPending ? "Saving..." : "Save default schedule"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-[#eadfd9] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8d5f53]">Section Progress</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[#2f2726]">Completion Ranking</h3>
            </div>
            <div className="space-y-3">
              {(rosterData?.sectionProgress ?? data?.sectionProgress ?? []).length ? (
                (rosterData?.sectionProgress ?? data?.sectionProgress ?? []).map((section) => (
                  <div key={section.sectionId ?? section.sectionName} className="rounded-2xl border border-[#efe4de] bg-[#fffcfa] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2f2726]">{section.sectionName}</p>
                        <p className="text-xs text-[#6b605d]">
                          {section.fullyPaidMembers} of {section.totalMembers} fully paid
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-[#2f2726]">{section.completionRate}%</p>
                        <p className="text-[11px] text-[#6b605d]">{currencyFormatter.format(section.outstandingAmount)} open</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[#eadfd9] bg-[#fffcfa] px-4 py-6 text-sm text-[#6b605d]">
                  Section rankings will appear once members and collection schedules are set up.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "rose" | "amber" | "blue" | "emerald";
}) {
  const toneMap = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  } as const;

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${toneMap[tone]}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
          <Icon icon={icon} className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
          <h3 className="font-display text-3xl font-bold">{value}</h3>
        </div>
      </div>
    </div>
  );
}
