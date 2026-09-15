import AppSidebar from './AppSidebar';
import Backdrop from './Backdrop';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

function InnerLayout({ children }) {
  const { isExpanded, isHovered } = useSidebar();
  const isSidebarVisible = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Outfit',sans-serif] text-slate-800 flex">
      <AppSidebar />
      <Backdrop />

      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarVisible ? "lg:pl-[270px]" : "lg:pl-[90px]"
        }`}
      >
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <InnerLayout>{children}</InnerLayout>
    </SidebarProvider>
  );
}