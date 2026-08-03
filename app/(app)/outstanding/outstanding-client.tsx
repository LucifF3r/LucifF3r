"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { SearchIcon, WalletIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/format"
import { recordPayment } from "../invoices/actions"

type Row = {
  id: string
  number: string
  customerId: string
  customerName: string
  customerPhone: string
  date: string
  total: number
  amountPaid: number
  balanceDue: number
  status: string
  ageDays: number
}

const METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Wallet"] as const

function AgingBadge({ days }: { days: number }) {
  let variant: "outline" | "secondary" | "destructive" = "outline"
  let label = `${days}d`
  if (days >= 60) {
    variant = "destructive"
    label = `${days}d overdue`
  } else if (days >= 30) {
    variant = "secondary"
    label = `${days}d`
  }
  return <Badge variant={variant}>{label}</Badge>
}

export function OutstandingClient({ rows, currency }: { rows: Row[]; currency: string }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [payTarget, setPayTarget] = useState<Row | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<(typeof METHODS)[number]>("Cash")
  const [isPending, startTransition] = useTransition()

  const totalOutstanding = useMemo(() => rows.reduce((s, r) => s + r.balanceDue, 0), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.number.toLowerCase().includes(q),
    )
  }, [rows, search])

  function openPay(row: Row) {
    setPayTarget(row)
    setAmount(row.balanceDue.toFixed(2))
    setMethod("Cash")
  }

  function submitPayment() {
    if (!payTarget) return
    const amt = Number.parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    startTransition(async () => {
      const res = await recordPayment({ invoiceId: payTarget.id, amount: amt, method })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Payment recorded")
        setPayTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-destructive">
              {formatCurrency(totalOutstanding, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unpaid invoices</p>
            <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Oldest</p>
            <p className="mt-1 text-2xl font-semibold">
              {rows.length ? `${Math.max(...rows.map((r) => r.ageDays))} days` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search outstanding"
              placeholder="Search customer, phone, invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2Icon />
                </EmptyMedia>
                <EmptyTitle>All settled</EmptyTitle>
                <EmptyDescription>There are no outstanding balances right now.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${row.id}`} className="hover:underline">
                          {row.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link href={`/customers/${row.customerId}`} className="hover:underline">
                            {row.customerName}
                          </Link>
                          <span className="text-xs text-muted-foreground">{row.customerPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                      <TableCell>
                        <AgingBadge days={row.ageDays} />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.total, currency)}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(row.balanceDue, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openPay(row)}>
                          <WalletIcon data-icon="inline-start" />
                          Collect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {payTarget
                ? `${payTarget.number} — ${payTarget.customerName}. Balance due ${formatCurrency(payTarget.balanceDue, currency)}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pay-amount">Amount</FieldLabel>
              <Input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pay-method">Method</FieldLabel>
              <Select
                value={method}
                onValueChange={(v) => setMethod((Array.isArray(v) ? v[0] : v) as (typeof METHODS)[number])}
              >
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={isPending}>
              {isPending && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
