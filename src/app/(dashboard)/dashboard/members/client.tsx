"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMembers } from "@/lib/api/members";
import { Icon } from "@iconify/react";
import MembersTable from "@/components/members/MembersTable";
import AddMemberDialog from "@/components/members/AddMemberDialog";
import { Skeleton } from "@/components/ui/skeleton";

type FilterStatus = "All" | "Good Standing" | "Has Installment Plan" | "Overdue";

export default function MembersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", "org1"],
    queryFn: () => getMembers(),
  });

  // Filter application
  const filteredMembers = members?.filter((member) => {
    // 1. apply status filter
    if (filter !== "All" && member.status !== filter) return false;

    // 2. apply search query securely
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        member.yearLevel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterPills: FilterStatus[] = ["All", "Good Standing", "Has Installment Plan", "Overdue"];

  return (
    <div className="flex h-full flex-col font-body pb-8">
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#343434]">Members Directory</h2>
          <p className="mt-1 text-sm text-[#625f5f]">
            Manage the students in your organization and their payment standings.
          </p>
        </div>
        
        <div className="shrink-0 flex items-center justify-end">
          <AddMemberDialog />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon icon="solar:magnifer-bold" className="h-5 w-5 text-[#625f5f]/50" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-[#F0ECEC] bg-white p-2.5 pl-10 text-sm font-medium outline-none transition-colors focus:border-[#a12124] focus:ring-1 focus:ring-[#a12124]"
            placeholder="Search by name or year level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setFilter(pill)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                filter === pill
                  ? "bg-[#343434] text-white shadow-sm"
                  : "bg-white border border-[#F0ECEC] text-[#625f5f] hover:bg-[#F9F7F6]"
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <MembersTable members={filteredMembers || []} />
      )}
    </div>
  );
}
