import { PageHeader } from "@/components/page-header"
import { getGarageSettings } from "@/lib/settings"
import { prisma } from "@/lib/prisma"
import { formatInvoiceNumber } from "@/lib/counter"
import { InvoicesClient } from "./invoices-client"

export const metadata = { title: "Invoices" }

export default async function InvoicesPage() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { number: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { makeModel: true, plate: true } },
      },
    }),
    getGarageSettings(),
  ])

  const rows = invoices.map((inv) => ({
    id: inv.id,
    number: formatInvoiceNumber(inv.number),
    customerName: inv.customer.name,
    customerPhone: inv.customer.phone,
    vehicle: inv.vehicle ? `${inv.vehicle.makeModel} (${inv.vehicle.plate})` : null,
    date: inv.date.toISOString(),
    total: inv.total,
    balanceDue: inv.balanceDue,
    status: inv.status,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="All sales invoices, searchable and filterable." />
      <InvoicesClient invoices={rows} currency={settings.currency} />
    </div>
  )
}
