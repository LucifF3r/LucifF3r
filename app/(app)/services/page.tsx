import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { ServicesClient } from "./services-client"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const [services, settings, categories] = await Promise.all([
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    getGarageSettings(),
    prisma.category.findMany({ where: { type: "service" }, orderBy: { name: "asc" } }),
  ])

  return (
    <ServicesClient
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        defaultPrice: s.defaultPrice,
        category: s.category,
        active: s.active,
      }))}
      categories={categories.map((c) => c.name)}
      currency={settings.currency}
    />
  )
}
