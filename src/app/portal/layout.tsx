"use client";

import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "ST";

  return (
    <div className="flex h-screen flex-col font-body bg-[#F9F7F6]">
      {/* Isolated Topbar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#F0ECEC] bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a12124]">
            <span className="font-display text-sm font-bold text-white">DF</span>
          </div>
          <h1 className="font-display text-lg font-bold text-[#343434]">Student Portal</h1>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
             <button className="relative text-[#625f5f] hover:text-[#343434]">
                <Icon icon="solar:bell-bold" className="h-5 w-5" />
             </button>
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D0808] text-xs font-bold text-white shadow-sm ring-2 ring-white">
                {initials}
             </div>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
