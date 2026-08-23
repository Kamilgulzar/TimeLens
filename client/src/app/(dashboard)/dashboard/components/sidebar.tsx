"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChartNoAxesColumn,
  ChevronDown,
  FileChartColumn,
  LayoutDashboard,
  List,
  LogOut,
  Menu as MenuIcon,
  Puzzle,
  Settings,
  Sparkles,
  Target,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useExtensionStatus } from "@/hooks/use-extension-status";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const iconProps = { size: 20, strokeWidth: 1.5 };
const smallIconProps = { size: 16, strokeWidth: 1.5 };

type NavItemData = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryNav: NavItemData[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/activities", label: "Activities", icon: Activity },
  { href: "/dashboard/timeline", label: "Timeline", icon: List },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/reports", label: "Reports", icon: FileChartColumn },
  { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
];

function useIsActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemBaseClass =
  "flex w-full items-center gap-3.5 rounded-[10px] px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const itemActiveClass = "bg-primary/10 font-medium text-foreground";
const itemInactiveClass =
  "text-muted-foreground hover:bg-muted/60 hover:text-foreground";

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: NavItemData & { pathname: string; onNavigate?: () => void }) {
  const isActive = useIsActive(href, pathname);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-11",
        itemBaseClass,
        isActive ? itemActiveClass : itemInactiveClass
      )}
    >
      <Icon
        {...iconProps}
        className={cn(
          "shrink-0",
          isActive ? "text-primary" : "text-muted-foreground/80"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ExtensionRow({
  active,
  connected,
  onNavigate,
}: {
  active: boolean;
  connected: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/dashboard/extension"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-[52px]",
        itemBaseClass,
        active ? itemActiveClass : itemInactiveClass
      )}
    >
      <Puzzle
        {...iconProps}
        className={cn(
          "shrink-0",
          active ? "text-primary" : "text-muted-foreground/80"
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="truncate leading-none">Extension</span>
        <span className="flex items-center gap-1.5 text-[11px] leading-none text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              connected ? "bg-success" : "bg-muted-foreground/40"
            )}
          />
          {connected ? "Connected" : "Not connected"}
        </span>
      </span>
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName =
    user && (user.firstName || user.lastName)
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : "Kamil Gulzar";
  const displayEmail = user?.email ?? "kamil@timelens.app";
  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((name) => name![0])
      .join("")
      .toUpperCase() || "KG";

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Open user menu"
        className="flex w-full cursor-default items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition-colors duration-150 select-none data-popup-open:bg-muted/60 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Avatar user={user} initials={initials} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-semibold text-foreground">
            {displayName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {displayEmail}
          </span>
        </span>
        <ChevronDown
          {...smallIconProps}
          className="shrink-0 text-muted-foreground"
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup className="min-w-[200px] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-sm outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <Menu.Item
              onClick={() => router.push("/dashboard/profile")}
              className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted"
            >
              <User {...smallIconProps} className="text-muted-foreground" />
              Profile
            </Menu.Item>
            <Menu.Separator className="mx-1.5 my-1 h-px bg-border" />
            <Menu.Item
              onClick={() => void logout()}
              className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-destructive outline-none select-none data-highlighted:bg-destructive/10"
            >
              <LogOut {...smallIconProps} className="text-destructive" />
              Sign Out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Avatar({
  user,
  initials,
}: {
  user: { avatar?: string | null } | null;
  initials: string;
}) {
  if (user?.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-1 ring-border">
      {initials}
    </span>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: extensionStatus } = useExtensionStatus();
  const extensionActive = useIsActive("/dashboard/extension", pathname);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex shrink-0 items-center gap-[1.5px] px-5 pt-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Logo className="h-[22px] w-auto shrink-0" />
        <span className="truncate text-lg font-semibold tracking-tight">
          TimeLens
        </span>
      </Link>

      <nav className="px-4 pt-9">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <Separator className="mt-7 mb-5" />
        <div className="space-y-1">
          <ExtensionRow
            active={extensionActive}
            connected={Boolean(extensionStatus?.connected)}
            onNavigate={onNavigate}
          />
          <NavItem
            href="/dashboard/settings"
            label="Settings"
            icon={Settings}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      </nav>

      <Separator className="mx-4 my-5" />
      <div className="px-1.5 pb-6">
        <UserMenu />
      </div>
    </div>
  );
}

const drawerTransitionClass =
  "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none";

export function Sidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <MenuIcon {...iconProps} />
        </button>
        <Link href="/" className="flex items-center gap-[1.5px] outline-none">
          <Logo className="h-[22px] w-auto" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            TimeLens
          </span>
        </Link>
      </header>

      <aside className="hidden h-full w-[270px] shrink-0 border-r border-border lg:block">
        <SidebarContent />
      </aside>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 block h-full w-full cursor-default bg-black/50",
            drawerTransitionClass,
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-background shadow-sm",
            drawerTransitionClass,
            open ? "-translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-end px-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X {...iconProps} />
            </button>
          </div>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
