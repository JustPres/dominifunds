"use client";

import { Icon } from "@iconify/react";

interface OrgData {
  id: string;
  name: string;
  course: string;
  collected: string;
  activeInstallments: number;
}

const mockOrgs: OrgData[] = [
  {
    id: "1",
    name: "SDCA BSIT",
    course: "BS Information Technology",
    collected: "₱125,400",
    activeInstallments: 18,
  },
  {
    id: "2",
    name: "SDCA BSCS",
    course: "BS Computer Science",
    collected: "₱98,200",
    activeInstallments: 12,
  },
  {
    id: "3",
    name: "SDCA BSIS",
    course: "BS Information Systems",
    collected: "₱74,800",
    activeInstallments: 9,
  },
  {
    id: "4",
    name: "SDCA BSEMC",
    course: "BS Entertainment & Multimedia",
    collected: "₱56,300",
    activeInstallments: 7,
  },
];

interface OrgSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export default function OrgSwitcher({ open, onClose }: OrgSwitcherProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-body">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#F0ECEC] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#343434]">
              Switch Organization
            </h2>
            <p className="text-xs text-[#625f5f]">
              Select an organization to manage
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#625f5f] transition-colors hover:bg-[#F0ECEC]"
          >
            <Icon icon="solar:close-circle-bold" className="h-5 w-5" />
          </button>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {mockOrgs.map((org) => (
            <button
              key={org.id}
              onClick={onClose}
              className="group flex flex-col rounded-xl border border-[#F0ECEC] bg-[#F9F7F6] p-4 text-left transition-all hover:border-[#a12124]/30 hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#a12124]">
                <Icon
                  icon="solar:buildings-2-bold"
                  className="h-4.5 w-4.5 text-white"
                />
              </div>
              <p className="font-display text-sm font-bold text-[#343434] group-hover:text-[#a12124]">
                {org.name}
              </p>
              <p className="mb-3 text-[11px] text-[#625f5f]">{org.course}</p>
              <div className="mt-auto flex items-center justify-between border-t border-[#F0ECEC] pt-2.5">
                <div>
                  <p className="text-[10px] text-[#625f5f]/60">Collected</p>
                  <p className="text-xs font-semibold text-[#343434]">
                    {org.collected}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#625f5f]/60">Active</p>
                  <p className="text-xs font-semibold text-[#a12124]">
                    {org.activeInstallments}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
