import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, router, usePage } from "@inertiajs/react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "@/Components/Avatar";

const CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-control bg-lavender-soft text-brand transition-all hover:bg-lavender/60 dark:bg-lavender/15 dark:text-lavender dark:hover:bg-lavender/25";

function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Mode terang" : "Mode gelap"}
      aria-label="Ubah tema"
      className={CONTROL_CLASS}
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M7.227 7.227L5.636 5.636m12.728 0l-1.591 1.591M7.227 16.773l-1.591 1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

export default function ShellTopbar() {
  const { toggleSidebar, toggleMobileSidebar, isMobileOpen } = useSidebar();
  const { props } = usePage();
  const user = props.auth?.user;
  const displayName = user?.name ?? "User";

  const inputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

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
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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
    if (!isProfileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsProfileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isLogoutModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loggingOut) setIsLogoutModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLogoutModalOpen, loggingOut]);

  return (
    <header className="relative z-10 flex h-[65px] w-full items-center px-4 lg:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
            className={CONTROL_CLASS}
          >
            {isMobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="hidden lg:block">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari materi, konsep, atau quiz..."
                className="h-10 w-72 rounded-control border border-track bg-surface py-1 pl-9 pr-12 text-xs text-ink placeholder-muted outline-none transition-all focus:border-peach focus:ring-2 focus:ring-peach/20 dark:border-white/10"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-track bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted dark:border-white/10">
                ⌘K
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggleButton />

          <button
            type="button"
            className={`relative ${CONTROL_CLASS}`}
            title="Notifikasi (mock)"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-peach" />
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              title={displayName}
              aria-label="Menu profil"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              className="flex h-10 items-center gap-2 rounded-control px-1.5 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/40"
            >
              <Avatar src={user?.avatar} name={displayName} />
              <span className="hidden max-w-[140px] truncate text-sm font-semibold text-ink sm:block">
                {displayName}
              </span>
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isProfileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-[80] mt-2 w-60 max-w-[calc(100vw-2rem)] animate-fade-in-up space-y-1 rounded-card bg-surface p-1.5 shadow-card-hover dark:ring-1 dark:ring-white/10"
              >
                {!user?.is_admin && (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 rounded-control px-3 py-2 text-xs font-medium text-muted transition-all hover:bg-canvas hover:text-ink"
                    >
                      <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      View Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 rounded-control px-3 py-2 text-xs font-medium text-muted transition-all hover:bg-canvas hover:text-ink"
                    >
                      <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </Link>
                    <div className="my-1 border-t border-track/70 dark:border-white/10" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-xs font-medium text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !loggingOut && setIsLogoutModalOpen(false)}
            />
            <div className="relative w-full max-w-sm rounded-card bg-surface p-6 shadow-card-hover dark:ring-1 dark:ring-white/10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <h3 id="logout-title" className="mt-4 text-center text-lg font-semibold text-ink">
                Keluar dari akun?
              </h3>
              <p className="mt-1.5 text-center text-sm text-muted">Kamu harus masuk lagi untuk melanjutkan belajar.</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={loggingOut}
                  className="h-10 flex-1 rounded-control bg-canvas text-sm font-medium text-ink transition-colors hover:bg-surface disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="h-10 flex-1 rounded-control bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? "Keluar…" : "Ya, keluar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
