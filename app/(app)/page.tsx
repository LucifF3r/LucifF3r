import { AppHeader } from "@/components/app-header"
import { prisma } from "@/lib/prisma"
import { getGarageSettings } from "@/lib/settings"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    settings,
    todayAgg,
    monthAgg,
    outstandingAgg,
    invoiceCount,
    customerCount,
    lowStockItems,
    recentInvoices,
  ] = await Promise.all([
    getGarageSettings(),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: true,
      where: { date: { gte: startOfToday } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { date: { gte: startOfMonth } },
    }),
    prisma.invoice.aggregate({
      _sum: { balanceDue: true },
      _count: true,
      where: { balanceDue: { gt: 0 } },
    }),
    prisma.invoice.count(),
    prisma.customer.count(),
    prisma.inventoryItem.findMany({
      where: { quantity: { lte: prisma.inventoryItem.fields.lowStockThreshold } },
      orderBy: { quantity: "asc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      orderBy: { number: "desc" },
      take: 6,
      include: { customer: { select: { name: true } } },
    }),
  ])

  const metrics = {
    todayRevenue: todayAgg._sum.total ?? 0,
    todayCount: todayAgg._count,
    monthRevenue: monthAgg._sum.total ?? 0,
    outstanding: outstandingAgg._sum.balanceDue ?? 0,
    outstandingCount: outstandingAgg._count,
    invoiceCount,
    customerCount,
    lowStockCount: lowStockItems.length,
  }

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="p-4 md:p-6">
        <DashboardClient
          currency={settings.currency}
          metrics={metrics}
          lowStock={lowStockItems.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            reorderLevel: i.lowStockThreshold,
          }))}
          recent={recentInvoices.map((inv) => ({
            id: inv.id,
            number: inv.number,
            customer: inv.customer.name,
            total: inv.total,
            status: inv.status,
            date: inv.date.toISOString(),
          }))}
        />
      </div>
    </>
  )
}
