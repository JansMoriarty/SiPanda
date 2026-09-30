import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, router, usePage } from "@inertiajs/react";
import { useSidebar } from "@/context/SidebarContext";
import Avatar from "@/Components/Avatar";

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/dashboard"),
  },
  {
    key: "materials",
    label: "Materials",
    href: "/materials",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/materials") || url.startsWith("/documents/"),
  },
  {
    key: "ask-panda",
    label: "Ask PANDA",
    href: "/ask-panda",
    icon: (
      <svg className="h-5 w-5 shrink-0 text-[#465FFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    badge: "NEW",
    activePattern: (url) => url.startsWith("/ask-panda"),
  },
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/progress"),
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/settings"),
  },
];

export default function ShellSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { url, props } = usePage();
  const user = props.auth?.user;
  const displayName = user?.name ?? "User";

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isSidebarVisible = isExpanded || isHovered || isMobileOpen;

  const handleLogout = () => {
    router.post(
      route("logout"),
      {},
      {
        onStart: () => setLoggingOut(true),
        onFinish: () => {
          setLoggingOut(false);
          setIsLogoutModalOpen(false);
        },
      }
    );
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLogoutModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loggingOut) setIsLogoutModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLogoutModalOpen, loggingOut]);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between border-r border-slate-200/80 bg-white font-['Outfit',sans-serif] text-slate-600 transition-all duration-300 ease-in-out ${
        isSidebarVisible ? "w-[270px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
        <div className={`flex items-center gap-3 px-6 py-6 ${!isSidebarVisible ? "px-0 lg:justify-center" : ""}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#465FFF] text-white shadow-md shadow-blue-500/20">
              <span className="text-xl font-bold">P</span>
            </div>
            {isSidebarVisible && (
              <span className="whitespace-nowrap text-xl font-bold tracking-tight text-slate-900">SiPanda</span>
            )}
          </Link>
        </div>

        <nav className="space-y-1.5 px-4 py-2">
          {isSidebarVisible && (
            <h2 className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">MENU</h2>
          )}

          {NAV.map((item) => {
            const active = item.activePattern(url);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active ? "bg-[#ECF2FF] font-semibold text-[#465FFF]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${!isSidebarVisible ? "justify-center px-0" : "justify-between"}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {isSidebarVisible && <span>{item.label}</span>}
                </div>
                {isSidebarVisible && item.badge && (
                  <span className="rounded-full bg-[#E8F8F0] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative border-t border-slate-200/80 p-3" ref={profileMenuRef}>
        {isProfileMenuOpen && isSidebarVisible && (
          <div className="absolute bottom-full left-3 right-3 z-50 mb-2 animate-fade-in-up space-y-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl">
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(false);
                setIsLogoutModalOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-all hover:bg-rose-50"
            >
              <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Log Out
            </button>
          </div>
        )}

        <div
          onClick={() => isSidebarVisible && setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-all hover:bg-slate-50 ${
            !isSidebarVisible ? "justify-center p-1 hover:bg-transparent" : ""
          }`}
        >
          <div className="relative shrink-0">
            <Avatar src={user?.avatar} name={displayName} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          {isSidebarVisible && (
            <div className="flex min-w-0 flex-1 items-center justify-between">
              <div className="flex min-w-0 flex-col">
                <h4 className="truncate text-xs font-semibold text-slate-900">{displayName}</h4>
                <span className="truncate text-[10px] font-medium text-slate-500">{user?.email}</span>
              </div>
              <button type="button" className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {isLogoutModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Outfit',sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => !loggingOut && setIsLogoutModalOpen(false)}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <h3 id="logout-title" className="mt-4 text-center text-lg font-semibold text-slate-900">
                Keluar dari akun?
              </h3>
              <p className="mt-1.5 text-center text-sm text-slate-500">Kamu harus masuk lagi untuk melanjutkan belajar.</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={loggingOut}
                  className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="h-10 flex-1 rounded-xl bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? "Keluar…" : "Ya, keluar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
