import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getGarageSettings } from "@/lib/settings"
import { PageHeader } from "@/components/page-header"
import { ReportsClient } from "./reports-client"

export const dynamic = "force-dynamic"

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default async function ReportsPage() {
  await requireAdmin()

  const [invoices, payments, lineItems, settings] = await Promise.all([
    prisma.invoice.findMany({
      select: { id: true, date: true, total: true, amountPaid: true, balanceDue: true, status: true },
    }),
    prisma.payment.findMany({ select: { amount: true, method: true, date: true } }),
    prisma.lineItem.findMany({
      where: { invoiceId: { not: null } },
      select: { kind: true, name: true, quantity: true, lineTotal: true },
    }),
    getGarageSettings(),
  ])

  // --- Monthly revenue (last 12 months) ---
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    })
  }
  const revenueByMonth = new Map<string, { billed: number; collected: number }>()
  for (const m of months) revenueByMonth.set(m.key, { billed: 0, collected: 0 })
  for (const inv of invoices) {
    const k = monthKey(inv.date)
    const bucket = revenueByMonth.get(k)
    if (bucket) bucket.billed += inv.total
  }
  for (const p of payments) {
    const k = monthKey(p.date)
    const bucket = revenueByMonth.get(k)
    if (bucket) bucket.collected += p.amount
  }
  const monthlyRevenue = months.map((m) => ({
    month: m.label,
    billed: Math.round((revenueByMonth.get(m.key)?.billed ?? 0) * 100) / 100,
    collected: Math.round((revenueByMonth.get(m.key)?.collected ?? 0) * 100) / 100,
  }))

  // --- Top services / parts by revenue ---
  const byName = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const li of lineItems) {
    const existing = byName.get(li.name) ?? { name: li.name, qty: 0, revenue: 0 }
    existing.qty += li.quantity
    existing.revenue += li.lineTotal
    byName.set(li.name, existing)
  }
  const topItems = [...byName.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((i) => ({ ...i, revenue: Math.round(i.revenue * 100) / 100 }))

  // --- Payment method breakdown ---
  const byMethod = new Map<string, number>()
  for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount)
  const paymentMethods = [...byMethod.entries()].map(([method, amount]) => ({
    method,
    amount: Math.round(amount * 100) / 100,
  }))

  // --- Aging buckets for outstanding invoices ---
  const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }
  for (const inv of invoices) {
    if (inv.balanceDue <= 0) continue
    const age = Math.floor((now.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24))
    if (age <= 30) buckets["0-30"] += inv.balanceDue
    else if (age <= 60) buckets["31-60"] += inv.balanceDue
    else if (age <= 90) buckets["61-90"] += inv.balanceDue
    else buckets["90+"] += inv.balanceDue
  }
  const aging = Object.entries(buckets).map(([range, amount]) => ({
    range,
    amount: Math.round(amount * 100) / 100,
  }))

  // --- Totals ---
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0)
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balanceDue, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Revenue, top sellers, collections, and receivables aging." />
      <ReportsClient
        currency={settings.currency}
        monthlyRevenue={monthlyRevenue}
        topItems={topItems}
        paymentMethods={paymentMethods}
        aging={aging}
        totals={{
          billed: Math.round(totalBilled * 100) / 100,
          collected: Math.round(totalCollected * 100) / 100,
          outstanding: Math.round(totalOutstanding * 100) / 100,
          invoiceCount: invoices.length,
        }}
      />
    </div>
  )
}
