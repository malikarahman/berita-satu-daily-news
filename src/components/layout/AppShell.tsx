"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpenText, ChevronsLeft, ChevronsRight, FileClock, LayoutDashboard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documentation", label: "Documentation", icon: BookOpenText },
  { href: "/logs", label: "Logs", icon: FileClock }
];

export function AppShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("beritasatu-sidebar-collapsed");
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("beritasatu-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-newsroom-surface">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside
          className={`sticky top-0 flex h-screen flex-col border-r border-newsroom-line bg-brand-navy py-6 text-white transition-all duration-200 ${
            collapsed ? "w-[88px] px-3" : "w-[280px] px-5"
          }`}
        >
          <div className={`flex ${collapsed ? "justify-center" : "items-center gap-3"}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-red text-lg font-bold">
              BS
            </div>
            <div className={collapsed ? "hidden" : "block"}>
              <div className="text-xs uppercase tracking-[0.12em] text-white/70">BeritaSatu</div>
              <div className="text-sm font-semibold">Cuaca Hari Ini</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`mt-5 inline-flex h-10 items-center rounded-md border border-white/15 bg-white/10 text-sm font-medium text-white/90 hover:bg-white/15 ${
              collapsed ? "justify-center px-0" : "justify-between px-3"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <>
              <span>Collapse</span>
              <ChevronsLeft size={16} />
            </>}
          </button>

          <nav className="mt-8 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active ? "bg-white text-brand-navy" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={17} />
                  <span className={collapsed ? "sr-only" : "inline"}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={`mt-auto rounded-md border border-white/15 bg-white/5 text-sm text-white/80 ${collapsed ? "p-3" : "p-4"}`}>
            <div className={`font-semibold text-white ${collapsed ? "text-center" : ""}`}>Batch Generate</div>
            <p className={`mt-2 leading-6 ${collapsed ? "hidden" : "block"}`}>
              Generate weather articles in batch melalui tombol Automated Generate Articles.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-newsroom-line bg-white">
            <div className="flex items-end justify-between px-8 py-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
                  Internal newsroom
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-newsroom-ink">{title}</h1>
                <p className="mt-1 text-sm text-newsroom-muted">{subtitle}</p>
              </div>
              <div className="rounded-md border border-brand-gold/50 bg-brand-goldSoft px-3 py-2 text-sm font-medium text-brand-navy">
                BMKG source: https://cuaca.bmkg.go.id/
              </div>
            </div>
          </header>

          <div className="px-8 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
