import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { InventoryClient } from "./inventory-client"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const [items, settings, categories] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    getGarageSettings(),
    prisma.category.findMany({ where: { type: "inventory" }, orderBy: { name: "asc" } }),
  ])

  return (
    <InventoryClient
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        category: i.category,
        costPrice: i.costPrice,
        sellingPrice: i.sellingPrice,
        quantity: i.quantity,
        lowStockThreshold: i.lowStockThreshold,
        unit: i.unit,
      }))}
      categories={categories.map((c) => c.name)}
      currency={settings.currency}
    />
  )
}
