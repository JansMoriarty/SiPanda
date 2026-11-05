import { Link, usePage } from "@inertiajs/react";
import { useSidebar } from "@/context/SidebarContext";

const NAV_SECTIONS = [
  {
    label: "Menu Utama",
    items: [
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
        activePattern: (url) => url === "/" || url.startsWith("/materials") || url.startsWith("/student") || url.startsWith("/documents/"),
      },
    ],
  },
  {
    label: "Belajar",
    items: [
      {
        key: "ask-panda",
        label: "Ask PANDA",
        href: "/ask-panda",
        icon: (
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
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
    ],
  },
  {
    label: "Lainnya",
    items: [
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
    ],
  },
];

const ADMIN_NAV = [
  {
    key: "admin",
    label: "Ringkasan",
    href: "/admin",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
      </svg>
    ),
    activePattern: (url) => url === "/admin",
  },
  {
    key: "admin-users",
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/admin/users"),
  },
  {
    key: "admin-online",
    label: "Online",
    href: "/admin/online",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/admin/online"),
  },
  {
    key: "admin-llm-usage",
    label: "Pemakaian AI",
    href: "/admin/llm-usage",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    activePattern: (url) => url.startsWith("/admin/llm-usage"),
  },
];

// Satu markup untuk item nav biasa & admin supaya gaya tidak menyimpang.
function NavItem({ item, active, show }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-control px-3.5 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-surface-raised font-semibold text-ink shadow-pill dark:ring-1 dark:ring-white/[0.06]"
          : "text-muted hover:bg-canvas hover:text-ink"
      } ${!show ? "justify-center px-0" : "justify-between"}`}
    >
      <div className="flex items-center gap-3">
        {item.icon}
        {show && <span>{item.label}</span>}
      </div>
      {show && item.badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            item.badgeTone === "hot"
              ? "bg-peach-soft text-ink dark:bg-peach/15 dark:text-peach"
              : "bg-lavender-soft text-brand dark:bg-lavender/15 dark:text-lavender"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Sekelompok item nav dengan label kategori di atasnya.
function SidebarSection({ label, items, url, show }) {
  return (
    <div className="space-y-1">
      {show && (
        <h2 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </h2>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.key} item={item} active={item.activePattern(url)} show={show} />
        ))}
      </div>
    </div>
  );
}

export default function ShellSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { url, props } = usePage();
  const user = props.auth?.user;

  const isSidebarVisible = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col justify-between bg-surface-tint font-['Outfit',sans-serif] text-muted transition-all duration-300 ease-in-out lg:static lg:z-auto lg:h-full lg:overflow-hidden lg:rounded-shell lg:shadow-card ${
        isSidebarVisible ? "w-[260px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
        <div className={`flex h-[65px] shrink-0 items-center gap-3 px-6 ${!isSidebarVisible ? "px-0 lg:justify-center" : ""}`}>
          <Link href={user?.is_admin ? "/admin" : "/student"} className="flex items-center gap-3">
            {isSidebarVisible ? (
              <img
                src="/images/sipanda-logo.png"
                alt="SiPanda"
                className="h-8 w-auto dark:brightness-0 dark:invert"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 overflow-hidden">
                <img
                  src="/images/sipanda-logo.png"
                  alt="SiPanda"
                  className="h-9 w-auto max-w-none dark:brightness-0 dark:invert"
                />
              </div>
            )}
          </Link>
        </div>

        <nav className="space-y-6 px-4 py-2">
          {user?.is_admin ? (
            <SidebarSection label="Admin" items={ADMIN_NAV} url={url} show={isSidebarVisible} />
          ) : (
            NAV_SECTIONS.map((section) => (
              <SidebarSection
                key={section.label}
                label={section.label}
                items={section.items}
                url={url}
                show={isSidebarVisible}
              />
            ))
          )}
        </nav>
      </div>

      {/* TODO: sembunyikan kalau user sudah premium (data dari backend) */}
      <div className={`mt-auto shrink-0 px-4 pb-5 ${!isSidebarVisible ? "flex justify-center" : ""}`}>
        {isSidebarVisible ? (
          <Link
            href={route("pricing.index")}
            className="group relative block overflow-hidden rounded-[20px] bg-surface px-5 pt-5 pb-0 shadow-[0_8px_30px_rgba(60,50,100,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(60,50,100,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
          >
            <h3 className="max-w-[150px] text-[17px] font-bold leading-snug text-brand dark:text-ink">
              Upgrade ke fitur premium
            </h3>
            <p className="mt-2 max-w-[150px] text-[11px] leading-snug text-muted">
              Buka semua fitur SiPanda tanpa batas
            </p>

            <div className="mt-3 flex h-[120px] items-end justify-between">
              <img
                src="/images/graduation-girl.png"
                alt=""
                className="pointer-events-none h-full w-auto object-contain object-bottom"
              />
              <span className="mb-4 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href={route("pricing.index")}
            title="Upgrade ke fitur premium"
            aria-label="Upgrade ke fitur premium"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white shadow-[0_8px_30px_rgba(60,50,100,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(60,50,100,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
