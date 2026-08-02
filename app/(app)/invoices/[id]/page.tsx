import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { formatInvoiceNumber } from "@/lib/counter"
import { InvoiceDetail } from "./invoice-detail"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const inv = await prisma.invoice.findUnique({ where: { id }, select: { number: true } })
  return { title: inv ? `Invoice ${formatInvoiceNumber(inv.number)}` : "Invoice" }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        lineItems: { orderBy: { id: "asc" } },
        payments: { orderBy: { date: "desc" } },
      },
    }),
    getGarageSettings(),
  ])

  if (!invoice) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/invoices" aria-label="Back to invoices" />}>
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-xl font-semibold">Invoice {formatInvoiceNumber(invoice.number)}</h1>
      </div>

      <InvoiceDetail
        currency={settings.currency}
        garage={{
          name: settings.name,
          address: settings.address,
          phone: settings.phone,
          logoUrl: settings.logoUrl,
        }}
        invoice={{
          id: invoice.id,
          number: formatInvoiceNumber(invoice.number),
          date: invoice.date.toISOString(),
          dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
          status: invoice.status,
          subtotal: invoice.subtotal,
          discount: invoice.discount,
          tax: invoice.tax,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          balanceDue: invoice.balanceDue,
          notes: invoice.notes,
          customer: {
            id: invoice.customer.id,
            name: invoice.customer.name,
            phone: invoice.customer.phone,
            address: invoice.customer.address,
          },
          vehicle: invoice.vehicle
            ? `${invoice.vehicle.makeModel} (${invoice.vehicle.plate})`
            : null,
          lineItems: invoice.lineItems.map((li) => ({
            id: li.id,
            name: li.name,
            kind: li.kind,
            quantity: li.quantity,
            price: li.price,
            lineTotal: li.lineTotal,
          })),
          payments: invoice.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            method: p.method,
            date: p.date.toISOString(),
            note: p.note,
          })),
        }}
      />
    </div>
  )
}
