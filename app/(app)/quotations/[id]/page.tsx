import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getGarageSettings } from "@/lib/settings"
import { formatQuotationNumber } from "@/lib/counter"
import { QuotationDetail } from "./quotation-detail"

export const dynamic = "force-dynamic"

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [quotation, settings] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        lineItems: { orderBy: { id: "asc" } },
      },
    }),
    getGarageSettings(),
  ])

  if (!quotation) notFound()

  return (
    <QuotationDetail
      quotation={{
        id: quotation.id,
        number: formatQuotationNumber(quotation.number),
        date: quotation.date.toISOString(),
        expiryDate: quotation.expiryDate ? quotation.expiryDate.toISOString() : null,
        status: quotation.status,
        convertedInvoiceId: quotation.convertedInvoiceId,
        notes: quotation.notes,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        tax: quotation.tax,
        total: quotation.total,
        customer: {
          name: quotation.customer.name,
          phone: quotation.customer.phone,
          email: quotation.customer.email,
          address: quotation.customer.address,
        },
        vehicle: quotation.vehicle
          ? `${quotation.vehicle.makeModel} (${quotation.vehicle.plate})`
          : null,
        lineItems: quotation.lineItems.map((li) => ({
          id: li.id,
          name: li.name,
          quantity: li.quantity,
          price: li.price,
          lineTotal: li.lineTotal,
        })),
      }}
      garage={settings}
      currency={settings.currency}
    />
  )
}
