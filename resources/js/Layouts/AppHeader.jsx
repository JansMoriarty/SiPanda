import { useEffect, useRef } from "react";
import { useSidebar } from "../context/SidebarContext";

const AppHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 h-[65px] flex w-full bg-[#0E1726] border-b border-[#1D293D] z-40 px-4 lg:px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center justify-center w-9 h-9 text-gray-400 border border-[#1D293D] bg-[#131E32] rounded-lg hover:bg-[#1C2744] hover:text-white transition-all"
            onClick={handleToggle}
          >
            {isMobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            )}
          </button>

          <div className="hidden lg:block">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or type command..."
                className="w-72 h-9 rounded-lg border border-[#1D293D] bg-[#131E32] py-1 pl-9 pr-12 text-xs text-white placeholder-gray-400 outline-none focus:border-blue-500 font-['Outfit']"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#1D293D] bg-[#0E1726] px-1.5 py-0.5 text-[10px] text-gray-400 font-mono">
                ⌘K
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#131E32] text-gray-400 hover:text-white border border-[#1D293D]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#131E32] text-gray-400 hover:text-white border border-[#1D293D] relative">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          <div className="h-5 w-[1px] bg-[#1D293D] mx-1"></div>

          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#465FFF] text-white flex items-center justify-center text-xs font-bold">
              U
            </div>
            <span className="text-xs font-medium text-gray-200 hidden sm:inline-block">User Admin</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;