"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  FileClock,
  Users,
  Package,
  Wrench,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(app)/actions"

const mainNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "New Sale", href: "/new-sale", icon: PlusCircle },
  { title: "Invoices", href: "/invoices", icon: FileText },
  { title: "Quotations", href: "/quotations", icon: FileClock },
]

const manageNav = [
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Services", href: "/services", icon: Wrench },
  { title: "Outstanding", href: "/outstanding", icon: AlertTriangle },
]

const insightsNav = [
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
]

function NavItem({ item, active }: { item: (typeof mainNav)[number]; active: boolean }) {
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.title}
        render={
          <Link href={item.href}>
            <Icon />
            <span>{item.title}</span>
          </Link>
        }
      />
    </SidebarMenuItem>
  )
}

export function AppSidebar({ garageName, userName }: { garageName: string; userName: string }) {
  const pathname = usePathname()

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="ASL Motors" className="size-9 object-contain" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold leading-tight">{garageName}</span>
            <span className="text-xs text-muted-foreground">POS &amp; Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <NavItem key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map((item) => (
                <NavItem key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightsNav.map((item) => (
                <NavItem key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials || "A"}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium leading-tight">{userName}</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </form>
        <p className="px-2 pb-1 text-center text-[10px] leading-tight text-muted-foreground">
          Developed by Ahsal | Palm Isle Collectives &copy; 2026
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
