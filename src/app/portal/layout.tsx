"use client";

import { useRoleStore } from "@/stores/role-store";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { viewAs, setViewAs } = useRoleStore();
  const pathname = usePathname();

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
           {/* Navigation Context */}
           <nav className="hidden md:flex items-center gap-1">
             <Link 
               href="/portal" 
               className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${pathname === "/portal" ? "bg-[#3D0808]/5 text-[#3D0808]" : "text-[#625f5f] hover:bg-slate-50"}`}
             >
               My Obligations
             </Link>
           </nav>

           <div className="h-6 w-px bg-[#F0ECEC]" />

           {/* View As Toggle directly in header for isolation test mapping */}
           <div className="flex items-center gap-2">
             <span className="text-[10px] uppercase font-bold text-[#625f5f] tracking-wider">Mode</span>
             <div className="flex rounded-md bg-slate-100 p-0.5">
               <button
                 onClick={() => setViewAs("OFFICER")}
                 className={`rounded px-2.5 py-1 text-[11px] font-bold transition-colors ${viewAs === "OFFICER" ? "bg-white text-[#343434] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
               >
                 OFFICER
               </button>
               <button
                 onClick={() => setViewAs("STUDENT")}
                 className={`rounded px-2.5 py-1 text-[11px] font-bold transition-colors ${viewAs === "STUDENT" ? "bg-white text-[#343434] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
               >
                 STUDENT
               </button>
             </div>
           </div>

           <div className="flex items-center gap-3 border-l border-[#F0ECEC] pl-6">
             <button className="relative text-[#625f5f] hover:text-[#343434]">
                <Icon icon="solar:bell-bold" className="h-5 w-5" />
             </button>
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D0808] text-xs font-bold text-white shadow-sm ring-2 ring-white">
                JD
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
