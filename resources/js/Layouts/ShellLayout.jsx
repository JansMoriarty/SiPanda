import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import ShellSidebar from "./ShellSidebar";
import ShellTopbar from "./ShellTopbar";
import Backdrop from "./Backdrop";

/**
 * Shell V2.
 *
 * Dipakai sebagai persistent layout Inertia (lihat `Dashboard.layout`),
 * bukan dibungkus manual di dalam tiap halaman seperti AppLayout V1.
 * Keuntungannya: sidebar & topbar tidak di-remount tiap navigasi,
 * sehingga state collapse sidebar & scroll tetap terjaga.
 *
 * Catatan: `useSidebar` TIDAK boleh dipanggil langsung di body komponen ini,
 * karena provider-nya ada di bawah. Sama seperti AppLayout V1, pemecahannya
 * adalah komponen Inner yang membaca context, lalu dibungkus provider.
 */
function InnerShell({ children }) {
  const { isExpanded, isHovered } = useSidebar();
  const isSidebarVisible = isExpanded || isHovered;

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[#F8FAFC] font-['Outfit',sans-serif] text-slate-800">
      <ShellSidebar />
      <Backdrop />

      <div
        className={`flex h-screen flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarVisible ? "lg:pl-[270px]" : "lg:pl-[90px]"
        }`}
      >
        <ShellTopbar />

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ShellLayout({ children }) {
  return (
    <SidebarProvider>
      <InnerShell>{children}</InnerShell>
    </SidebarProvider>
  );
}
