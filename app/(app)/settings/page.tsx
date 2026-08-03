import { AppHeader } from "@/components/app-header"
import { getGarageSettings } from "@/lib/settings"
import { requireAdmin } from "@/lib/session"
import { SettingsClient } from "./settings-client"

export const metadata = { title: "Settings — MotoGarage POS" }

export default async function SettingsPage() {
  const settings = await getGarageSettings()
  const session = await requireAdmin()
  const displayName = session.user?.name || "Admin"

  return (
    <>
      <AppHeader title="Settings" />
      <div className="p-4 md:p-6">
        <SettingsClient
          displayName={displayName}
          profile={{
            name: settings.name,
            logoUrl: settings.logoUrl ?? "",
            address: settings.address ?? "",
            phone: settings.phone ?? "",
            email: settings.email ?? "",
            currencySymbol: settings.currency,
            taxRate: settings.taxRate,
          }}
        />
      </div>
    </>
  )
}
