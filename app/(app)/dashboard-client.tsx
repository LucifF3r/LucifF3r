"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { formatInvoiceNumber } from "@/lib/counter"
import {
  PlusCircleIcon,
  FileTextIcon,
  UsersIcon,
  TriangleAlertIcon,
  WalletIcon,
  TrendingUpIcon,
  PackageIcon,
} from "lucide-react"

type Metrics = {
  todayRevenue: number
  todayCount: number
  monthRevenue: number
  outstanding: number
  outstandingCount: number
  invoiceCount: number
  customerCount: number
  lowStockCount: number
}

type LowStock = { id: string; name: string; quantity: number; reorderLevel: number }
type Recent = {
  id: string
  number: number
  customer: string
  total: number
  status: string
  date: string
}

export function DashboardClient({
  currency,
  metrics,
  lowStock,
  recent,
}: {
  currency: string
  metrics: Metrics
  lowStock: LowStock[]
  recent: Recent[]
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/new-sale" />}>
          <PlusCircleIcon data-icon="inline-start" />
          New Sale
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/quotations" />}>
          <FileTextIcon data-icon="inline-start" />
          Quotations
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/outstanding" />}>
          <WalletIcon data-icon="inline-start" />
          Collect Payments
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TrendingUpIcon className="size-4" />}
          label="Today's revenue"
          value={formatCurrency(metrics.todayRevenue, currency)}
          sub={`${metrics.todayCount} sale${metrics.todayCount === 1 ? "" : "s"} today`}
        />
        <MetricCard
          icon={<WalletIcon className="size-4" />}
          label="This month"
          value={formatCurrency(metrics.monthRevenue, currency)}
          sub="Billed this month"
        />
        <MetricCard
          icon={<TriangleAlertIcon className="size-4" />}
          label="Outstanding"
          value={formatCurrency(metrics.outstanding, currency)}
          sub={`${metrics.outstandingCount} unpaid invoice${metrics.outstandingCount === 1 ? "" : "s"}`}
          accent="negative"
        />
        <MetricCard
          icon={<UsersIcon className="size-4" />}
          label="Customers"
          value={String(metrics.customerCount)}
          sub={`${metrics.invoiceCount} invoices total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>Your latest sales activity.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/invoices" />}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <FileTextIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No invoices yet. Create your first sale.</p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {recent.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{inv.customer}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatInvoiceNumber(inv.number)} · {formatDate(inv.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <InvoiceStatusBadge status={inv.status} />
                        <span className="font-medium tabular-nums">
                          {formatCurrency(inv.total, currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Items at or below reorder level.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/inventory" />}>
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <PackageIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">All parts are well stocked.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{item.name}</span>
                    <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>
                      {item.quantity} / {item.reorderLevel}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: "negative"
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <p className="text-sm">{label}</p>
        </div>
        <p className={`mt-2 text-2xl font-semibold ${accent === "negative" ? "text-destructive" : ""}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
