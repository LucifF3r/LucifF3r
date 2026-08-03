import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getGarageSettings } from "@/lib/settings"
import { formatQuotationNumber } from "@/lib/counter"
import { PageHeader } from "@/components/page-header"
import { QuotationsClient } from "./quotations-client"

export const dynamic = "force-dynamic"

export default async function QuotationsPage() {
  await requireAdmin()

  const [quotations, settings] = await Promise.all([
    prisma.quotation.findMany({
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { number: "desc" },
    }),
    getGarageSettings(),
  ])

  const rows = quotations.map((q) => ({
    id: q.id,
    number: formatQuotationNumber(q.number),
    customerName: q.customer.name,
    customerPhone: q.customer.phone,
    date: q.date.toISOString(),
    total: q.total,
    status: q.status,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Quotations" description="Create, track, and convert quotations into invoices." />
      <QuotationsClient quotations={rows} currency={settings.currency} />
    </div>
  )
}
