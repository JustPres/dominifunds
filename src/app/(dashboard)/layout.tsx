import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { auth } from "@/lib/auth";
import { getDashboardThemeCssVariables } from "@/lib/org-branding";
import { resolveOrganizationSettings } from "@/lib/org-settings";
import type { CSSProperties } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const orgSettings = await resolveOrganizationSettings(session?.user?.orgId);

  return (
    <div
      className="flex h-screen font-body"
      style={getDashboardThemeCssVariables(orgSettings.themePreset) as CSSProperties}
    >
      <Sidebar orgDisplayName={orgSettings.displayName} />

      <div className="ml-[220px] flex flex-1 flex-col">
        <Topbar orgDisplayName={orgSettings.displayName} />
        <main className="flex-1 overflow-y-auto bg-[var(--dashboard-main-bg)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
