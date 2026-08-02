"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, EyeIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { formatCurrency, formatDate } from "@/lib/format"

type Invoice = {
  id: string
  number: string
  customerName: string
  customerPhone: string
  vehicle: string | null
  date: string
  total: number
  balanceDue: number
  status: string
}

export function InvoicesClient({
  invoices,
  currency,
}: {
  invoices: Invoice[]
  currency: string
}) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null
    return invoices.filter((inv) => {
      if (q) {
        const hay = `${inv.number} ${inv.customerName} ${inv.customerPhone} ${inv.vehicle ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (status !== "all" && inv.status !== status) return false
      const d = new Date(inv.date)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }, [invoices, search, status, fromDate, toDate])

  const totalValue = filtered.reduce((s, i) => s + i.total, 0)
  const outstandingValue = filtered.reduce((s, i) => s + i.balanceDue, 0)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-end lg:gap-4">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoice #, customer, phone, vehicle…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Outstanding">Outstanding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" className="w-40" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" className="w-40" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-muted-foreground">Showing </span>
          <span className="font-medium">{filtered.length}</span>
          <span className="text-muted-foreground"> invoices</span>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-muted-foreground">Total value </span>
          <span className="font-medium tabular-nums">{formatCurrency(totalValue, currency)}</span>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-muted-foreground">Outstanding </span>
          <span className="font-medium tabular-nums">{formatCurrency(outstandingValue, currency)}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>No invoices found</EmptyTitle>
                <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium tabular-nums">{inv.number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{inv.customerName}</span>
                        {inv.vehicle && (
                          <span className="text-xs text-muted-foreground">{inv.vehicle}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(inv.total, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {inv.balanceDue > 0 ? (
                        <span className="font-medium text-destructive">
                          {formatCurrency(inv.balanceDue, currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="View invoice"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/invoices/${inv.id}`)
                        }}
                      >
                        <EyeIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
