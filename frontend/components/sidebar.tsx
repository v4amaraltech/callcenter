"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

/* ── Context ──────────────────────────────────────────────────────────────── */

type SidebarCtxType = {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarCtx = createContext<SidebarCtxType>({
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarCtx.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function MobileMenuButton() {
  const { setMobileOpen } = useContext(SidebarCtx);
  return (
    <button
      type="button"
      aria-label="Abrir menu"
      onClick={() => setMobileOpen(true)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

/* ── Nav structure ────────────────────────────────────────────────────────── */

type NavLink = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; links: NavLink[] };

const baseGroups: NavGroup[] = [
  {
    label: "PRINCIPAL",
    links: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/campaigns", label: "Campanhas", icon: Megaphone },
    ],
  },
  {
    label: "OPERAÇÃO",
    links: [
      { href: "/agents", label: "Agentes", icon: Bot },
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/results", label: "Ligações", icon: PhoneCall },
      { href: "/tasks", label: "Tarefas", icon: CheckSquare },
    ],
  },
  {
    label: "SISTEMA",
    links: [
      { href: "/config", label: "Configurações", icon: Settings },
    ],
  },
];

/* ── Shared nav content ───────────────────────────────────────────────────── */

function NavContent({
  collapsed,
  allGroups,
  pathname,
  user,
  initials,
  resolvedTheme,
  setTheme,
  signingOut,
  onSignOut,
  onCollapse,
}: {
  collapsed: boolean;
  allGroups: NavGroup[];
  pathname: string;
  user: { name?: string; email?: string; avatar?: string } | null;
  initials: string;
  resolvedTheme: string | undefined;
  setTheme: (t: string) => void;
  signingOut: boolean;
  onSignOut: () => void;
  onCollapse?: () => void;
}) {
  return (
    <>
      {/* Logo / header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-3",
          collapsed ? "px-2.5" : "px-3",
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
            <Image
              src="/v4-brand-symbol.png"
              alt="V4"
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain brightness-0 invert"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col justify-center leading-none">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">V4</p>
              <p className="mt-0.5 text-lg font-semibold tracking-[0.2em] text-foreground">CALL</p>
            </div>
          )}
        </div>

        {onCollapse && (
          <button
            type="button"
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            onClick={onCollapse}
            className="rounded-md border border-sidebar-border bg-background/60 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
        {allGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed ? (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border" />
            )}
            {group.links.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "",
                    active
                      ? "bg-primary text-white shadow-[0_2px_8px_rgba(234,59,23,0.35)]"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-3 border-t border-sidebar-border pt-4">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className={cn(
            "flex w-full h-10 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 text-sm text-sidebar-foreground/80 transition hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          {!collapsed && (
            <span>{resolvedTheme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          )}
        </button>

        <div
          className={cn(
            "rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name ?? "Usuário"}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name ?? "Usuário"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? "Sem sessão"}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="rounded-md border border-sidebar-border bg-background/60 p-1.5 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="mt-2.5 flex w-full items-center justify-center rounded-md border border-sidebar-border bg-background/60 p-1.5 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Main Sidebar component ───────────────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { mobileOpen, setMobileOpen } = useContext(SidebarCtx);

  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email?.split("@")[0],
        email: session.user.email ?? undefined,
        avatar: session.user.image ?? undefined,
      }
    : null;

  useEffect(() => {
    const sessionUser = session?.user as
      | { id?: string; admin?: boolean }
      | undefined;
    setIsAdmin(Boolean(sessionUser?.admin));
  }, [session]);

  const allGroups = useMemo<NavGroup[]>(() => {
    if (!isAdmin) return baseGroups;
    return [
      ...baseGroups,
      {
        label: "ADMIN",
        links: [{ href: "/admin", label: "Admin", icon: ShieldCheck }],
      },
    ];
  }, [isAdmin]);

  const hidden =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/pending");
  if (hidden) return null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((chunk) => chunk[0])
      .join("")
      .toUpperCase() ?? "VC";

  const sharedProps = {
    allGroups,
    pathname,
    user,
    initials,
    resolvedTheme,
    setTheme,
    signingOut,
    onSignOut: () => void handleSignOut(),
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex"
      >
        <NavContent
          {...sharedProps}
          collapsed={collapsed}
          onCollapse={() => {
            const next = !collapsed;
            localStorage.setItem("sidebar-collapsed", String(next));
            setCollapsed(next);
          }}
        />
      </motion.aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-72 border-r border-sidebar-border bg-sidebar p-3 flex flex-col gap-0"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 rounded-md border border-sidebar-border bg-background/60 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <NavContent {...sharedProps} collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
