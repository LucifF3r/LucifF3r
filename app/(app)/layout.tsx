import type React from "react"
import { requireAdmin } from "@/lib/session"
import { getGarageSettings } from "@/lib/settings"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const settings = await getGarageSettings()
  const userName = session.user?.name || "Admin"

  return (
    <SidebarProvider>
      <AppSidebar garageName={settings.name} userName={userName} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
