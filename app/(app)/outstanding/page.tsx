import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getGarageSettings } from "@/lib/settings"
import { formatInvoiceNumber } from "@/lib/counter"
import { PageHeader } from "@/components/page-header"
import { OutstandingClient } from "./outstanding-client"

export const dynamic = "force-dynamic"

export default async function OutstandingPage() {
  await requireAdmin()

  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      where: { balanceDue: { gt: 0 } },
      include: { customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { date: "asc" },
    }),
    getGarageSettings(),
  ])

  const now = Date.now()
  const rows = invoices.map((inv) => {
    const ageDays = Math.floor((now - inv.date.getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: inv.id,
      number: formatInvoiceNumber(inv.number),
      customerId: inv.customer.id,
      customerName: inv.customer.name,
      customerPhone: inv.customer.phone,
      date: inv.date.toISOString(),
      total: inv.total,
      amountPaid: inv.amountPaid,
      balanceDue: inv.balanceDue,
      status: inv.status,
      ageDays,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Outstanding Balances"
        description="Every unpaid or partially paid invoice, with aging and quick collection."
      />
      <OutstandingClient rows={rows} currency={settings.currency} />
    </div>
  )
}
