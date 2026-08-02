import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { PageHeader } from "@/components/page-header"
import { CustomersClient } from "./customers-client"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const [customers, settings] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicles: true,
        invoices: {
          select: { total: true, amountPaid: true },
        },
        _count: { select: { invoices: true, vehicles: true } },
      },
    }),
      getGarageSettings(),
  ])

  const rows = customers.map((c) => {
    const lifetime = c.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    const outstanding = c.invoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      notes: c.notes,
      vehicleCount: c._count.vehicles,
      invoiceCount: c._count.invoices,
      lifetime,
      outstanding,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" description="Manage customers, vehicles, and history." />
      <CustomersClient customers={rows} currency={settings.currency} />
    </div>
  )
}
