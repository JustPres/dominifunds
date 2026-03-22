"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { getMonthlyDues, sendReminder, DayDues } from "@/lib/api/calendar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardCalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ["calendar-dues", "org1", currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getMonthlyDues("org1", currentMonth.getMonth() + 1, currentMonth.getFullYear()),
  });

  // Remind Mutation
  const remindMutation = useMutation({
    mutationFn: sendReminder,
    onSuccess: () => {
      toast.success("Reminder sent successfully!");
    },
  });

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (dayString: string, dayDate: Date, hasDues: boolean) => {
    if (hasDues) {
      setSelectedDate(dayDate);
    } else {
      setSelectedDate(null);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Selected Day Data
  const selectedDayString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDues: DayDues | null =
    selectedDayString && data?.duesByDate ? data.duesByDate[selectedDayString] : null;

  return (
    <div className="flex h-full flex-col font-body lg:flex-row gap-6 pb-6">
      {/* LEFT COLUMN: Calendar Grid (1fr) */}
      <div className="flex-1 rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#343434]">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0ECEC] text-[#625f5f] transition-colors hover:bg-[#F9F7F6]"
            >
              <Icon icon="solar:alt-arrow-left-bold" className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0ECEC] text-[#625f5f] transition-colors hover:bg-[#F9F7F6]"
            >
              <Icon icon="solar:alt-arrow-right-bold" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Weekday Names */}
        <div className="mb-2 grid grid-cols-7 gap-3">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-[#625f5f]/70">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid flex-1 grid-cols-7 gap-3 pb-4">
          {isLoading ? (
            <div className="col-span-7 flex h-[400px] items-center justify-center text-[#625f5f]/50 flex-col gap-4">
               <Icon icon="solar:calendar-mark-bold-duotone" className="h-10 w-10 animate-pulse" />
               <p className="text-sm font-medium">Loading calendar...</p>
            </div>
          ) : (
            calendarDays.map((day, idx) => {
              const dayString = format(day, "yyyy-MM-dd");
              const duesForDay = data?.duesByDate?.[dayString];
              const hasInstallment = duesForDay?.items.some((i) => i.dueType === "INSTALLMENT");
              const hasFull = duesForDay?.items.some((i) => i.dueType === "FULL");

              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(dayString, day, !!duesForDay)}
                  className={`relative flex min-h-[90px] flex-col rounded-xl border p-2 text-sm transition-all
                    ${!isCurrentMonth ? "opacity-30 bg-[#F9F7F6]/50 border-transparent cursor-default" : "cursor-pointer border-[#F0ECEC] bg-white"}
                    ${isSelected ? "bg-[#a12124] border-[#a12124] text-white shadow-md shadow-[#a12124]/20" : ""}
                    ${!isSelected && today ? "border-[#a12124]/50 shadow-[0_0_12px_rgba(161,33,36,0.15)] ring-1 ring-[#a12124]" : ""}
                    ${!isSelected && isCurrentMonth && !today && "hover:border-[#a12124]/30 hover:shadow-sm"}
                  `}
                >
                  <span className={`font-display font-bold ${isSelected ? "text-white" : "text-[#343434]"}`}>
                    {format(day, "d")}
                  </span>

                  {/* Chips */}
                  <div className="mt-auto flex flex-wrap gap-1 pt-1">
                    {hasInstallment && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        INST
                      </span>
                    )}
                    {hasFull && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                        FULL
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-auto flex items-center gap-4 border-t border-[#F0ECEC] pt-4 text-xs font-medium text-[#625f5f]">
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-sm bg-amber-400"></span> Installment Due
          </div>
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-sm bg-red-500"></span> Full Payment Due
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Detail Panel (300px) */}
      <div className="flex w-full flex-col gap-6 lg:w-[320px]">
        {/* Detail Card */}
        <div className="flex min-h-[400px] flex-col rounded-2xl border border-[#F0ECEC] bg-white p-5 shadow-sm">
          {!selectedDues ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-[#625f5f]/50">
              <Icon icon="solar:calendar-date-bold-duotone" className="mb-3 h-12 w-12 text-[#F0ECEC]" />
              <p className="font-display font-bold text-[#625f5f]">No Date Selected</p>
              <p className="mt-1 text-xs">Click on an active date to view due items.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 border-b border-[#F0ECEC] pb-4">
                <h3 className="font-display text-lg font-bold text-[#343434]">
                  {format(selectedDate!, "MMMM d, yyyy")}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-[#a12124]">
                  {selectedDues.items.length} items due
                </p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {selectedDues.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4 text-left transition-all hover:border-[#a12124]/30 hover:shadow-sm">
                    <p className="font-display text-sm font-bold text-[#343434]">
                      {item.memberName}
                    </p>
                    <p className="text-[11px] text-[#625f5f] mb-2">
                      {item.fundType}
                    </p>
                    
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#625f5f]/70">
                        {item.dueType === "INSTALLMENT" ? item.installmentInfo : "Full Payment"}
                      </span>
                      <span className="font-display text-sm font-bold text-[#a12124]">
                        ₱{item.amountDue.toLocaleString()}
                      </span>
                    </div>

                    <button 
                      onClick={() => remindMutation.mutate(item.memberId)}
                      disabled={remindMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-[#F0ECEC] py-2 text-xs font-bold text-[#343434] transition-colors hover:bg-[#F0ECEC] disabled:opacity-50"
                    >
                      <Icon icon="solar:bell-bing-bold" className="h-4 w-4 text-[#a12124]" />
                      Send Reminder
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly Summary Card */}
        <div className="rounded-2xl border border-[#F0ECEC] bg-[#3D0808] p-5 shadow-sm text-white">
          <h3 className="mb-4 font-display text-sm font-bold">
            {format(currentMonth, "MMMM")} Summary
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs text-white/70">Installment Dues</span>
                <span className="font-bold">{data?.summary.installmentsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs text-white/70">Full Payment Dues</span>
                <span className="font-bold">{data?.summary.fullPaymentsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-emerald-400">Fully Current Members</span>
                <span className="font-bold text-emerald-400">{data?.summary.fullyCurrentMembers || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
