import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen font-body">
      {/* Sidebar — fixed 220px */}
      <Sidebar />

      {/* Main area — offset by sidebar width */}
      <div className="ml-[220px] flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[#F9F7F6] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
