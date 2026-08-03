import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { formatInvoiceNumber } from "@/lib/counter"
import { Button } from "@/components/ui/button"
import { CustomerProfile } from "./customer-profile"

export const dynamic = "force-dynamic"

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [customer, settings] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { createdAt: "desc" } },
        invoices: {
          orderBy: { date: "desc" },
          include: { vehicle: true },
        },
      },
    }),
      getGarageSettings(),
  ])

  if (!customer) notFound()

  const lifetime = customer.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
  const outstanding = customer.invoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)
  const totalBilled = customer.invoices.reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href="/customers" aria-label="Back" />}
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
      </div>

      <CustomerProfile
        customer={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
        }}
        vehicles={customer.vehicles.map((v) => ({
          id: v.id,
          makeModel: v.makeModel,
          plateNumber: v.plate,
          year: v.year,
        }))}
        invoices={customer.invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: formatInvoiceNumber(inv.number),
          date: inv.date.toISOString(),
          vehicle: inv.vehicle ? `${inv.vehicle.makeModel} (${inv.vehicle.plate})` : null,
          total: inv.total,
          amountPaid: inv.amountPaid,
          status: inv.status,
        }))}
        stats={{ lifetime, outstanding, totalBilled, invoiceCount: customer.invoices.length }}
        currency={settings.currency}
      />
    </div>
  )
}
