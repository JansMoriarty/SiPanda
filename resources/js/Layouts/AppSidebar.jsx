import { useState, useRef, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useSidebar } from "@/context/SidebarContext";

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { url } = usePage();
  
  // State untuk Dropdown User Profile
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isActive = (path) => url === path;
  const isSidebarVisible = isExpanded || isHovered || isMobileOpen;

  // Close dropdown saat klik di luar area profil
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r font-['Outfit',sans-serif] transition-all duration-300 ease-in-out
        bg-white border-slate-200/80 text-slate-600 justify-between
        ${isSidebarVisible ? "w-[270px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Section */}
      <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
        <div className={`flex items-center gap-3 px-6 py-6 ${!isSidebarVisible ? "lg:justify-center px-0" : ""}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#465FFF] text-white shadow-md shadow-blue-500/20 shrink-0">
              <span className="text-xl font-bold">P</span>
            </div>
            {isSidebarVisible && (
              <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                SiPanda
              </span>
            )}
          </Link>
        </div>

        <nav className="px-4 py-2 space-y-1.5">
          {isSidebarVisible && (
            <h2 className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              MENU
            </h2>
          )}

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isActive("/dashboard")
                ? "bg-[#ECF2FF] text-[#465FFF] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${!isSidebarVisible ? "justify-center px-0" : ""}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {isSidebarVisible && <span>Dashboard</span>}
          </Link>

          {/* File Manager */}
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isActive("/")
                ? "bg-[#ECF2FF] text-[#465FFF] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${!isSidebarVisible ? "justify-center px-0" : ""}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {isSidebarVisible && <span>File Manager</span>}
          </Link>

          {/* PANDA AI (Langsung Single Menu tanpa Submenu Dropdown) */}
          <Link
            href="/ask-panda"
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isActive("/ask-panda")
                ? "bg-[#ECF2FF] text-[#465FFF] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${!isSidebarVisible ? "justify-center px-0" : ""}`}
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 shrink-0 text-[#465FFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {isSidebarVisible && <span>Ask PANDA</span>}
            </div>

            {isSidebarVisible && (
              <span className="rounded-full bg-[#E8F8F0] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                NEW
              </span>
            )}
          </Link>

          {/* Text Generator */}
          <Link
            href="/text-generator"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isActive("/text-generator")
                ? "bg-[#ECF2FF] text-[#465FFF] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${!isSidebarVisible ? "justify-center px-0" : ""}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {isSidebarVisible && <span>Text Generator</span>}
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isActive("/settings")
                ? "bg-[#ECF2FF] text-[#465FFF] font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${!isSidebarVisible ? "justify-center px-0" : ""}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isSidebarVisible && <span>Settings</span>}
          </Link>
        </nav>
      </div>

      {/* Bottom Minimalist Profile Card with Pop-up Dropdown */}
      <div className="p-3 border-t border-slate-200/80 relative" ref={profileMenuRef}>
        
        {/* Pop-up Dropdown Menu */}
        {isProfileMenuOpen && isSidebarVisible && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 space-y-1 z-50 animate-fade-in-up">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              View Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </Link>
            <div className="my-1 border-t border-slate-100"></div>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Log Out
            </Link>
          </div>
        )}

        {/* Minimalist Profile Button */}
        <div 
          onClick={() => isSidebarVisible && setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer ${
            !isSidebarVisible ? "justify-center p-1 hover:bg-transparent" : ""
          }`}
        >
          {/* Bulat Profile Avatar */}
          <div className="relative shrink-0">
            <img
              src="https://ui-avatars.com/api/?name=User+Admin&background=465FFF&color=fff"
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          {/* Minimalist Info & Option Trigger */}
          {isSidebarVisible && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <h4 className="text-xs font-semibold text-slate-900 truncate">User Admin</h4>
                <span className="text-[10px] font-medium text-emerald-600">Free Plan</span>
              </div>

              {/* Three Dots Icon */}
              <button 
                type="button" 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
} 