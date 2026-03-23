"use client";

import { MonthlyCollection } from "@/lib/api/report";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CollectionBarChart({ data }: { data: MonthlyCollection[] }) {
  // Determine dynamically the active month locally formatting correctly (e.g. "Mar")
  const currentMonth = useMemo(() => format(new Date(), "MMM"), []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-display text-lg font-bold text-[#343434]">Monthly Collections Trend</h3>
        <p className="text-xs text-[#625f5f]">Academic Year Aggregated Overview</p>
      </div>

      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#625f5f", fontWeight: 600 }}
              dy={10}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-[#F0ECEC] bg-[#343434] px-3 py-2 text-white shadow-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">{payload[0].payload.month} Collections</p>
                      <p className="font-display text-lg font-bold">
                        ₱{payload[0].value?.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 4, 4]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.month === currentMonth ? "#a12124" : "#F0ECEC"} 
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
