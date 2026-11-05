import { SidebarProvider } from "@/context/SidebarContext";
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
 * Sidebar dan area konten berada di panel rounded terpisah dengan jarak,
 * sementara topbar diberi jarak dari konten di dalam panel konten.
 * Di layar kecil panel jadi full-bleed dan sidebar tetap berupa drawer.
 */
function InnerShell({ children }) {
  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-canvas p-0 font-['Outfit',sans-serif] text-ink lg:p-5">
      <div className="flex h-full min-h-0 w-full flex-row lg:gap-5">
        <ShellSidebar />
        <Backdrop />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-tint lg:rounded-shell lg:shadow-card">
          <div className="shrink-0 pb-4">
            <ShellTopbar />
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto bg-surface-tint no-scrollbar">
            {children}
          </main>
        </div>
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
