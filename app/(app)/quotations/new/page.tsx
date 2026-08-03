import { PageHeader } from "@/components/page-header"
import { getGarageSettings } from "@/lib/settings"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { NewSaleClient } from "../../new-sale/new-sale-client"

export const metadata = { title: "New Quotation" }
export const dynamic = "force-dynamic"

export default async function NewQuotationPage() {
  await requireAdmin()

  const [customers, services, inventory, settings] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { vehicles: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    getGarageSettings(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Quotation" description="Create a quotation for a customer." />
      <NewSaleClient
        lockedDocType="quotation"
        currency={settings.currency}
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          vehicles: c.vehicles.map((v) => ({
            id: v.id,
            label: `${v.makeModel} (${v.plate})`,
          })),
        }))}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.defaultPrice,
          category: s.category,
        }))}
        inventory={inventory.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.sellingPrice,
          stock: i.quantity,
          unit: i.unit,
        }))}
      />
    </div>
  )
}
