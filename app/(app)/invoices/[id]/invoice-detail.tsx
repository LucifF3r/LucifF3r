"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DownloadIcon, WalletIcon, Loader2Icon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { printPdfBlob, savePdfBlob } from "@/lib/pdf-output"
import { recordPayment, deleteInvoice } from "../actions"
import type { PdfData } from "@/components/invoice-pdf"

type LineItem = {
  id: string
  name: string
  kind: string
  quantity: number
  price: number
  lineTotal: number
}
type Payment = { id: string; amount: number; method: string; date: string; note: string | null }
type InvoiceData = {
  id: string
  number: string
  date: string
  dueDate: string | null
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  balanceDue: number
  notes: string | null
  customer: { id: string; name: string; phone: string; address: string | null }
  vehicle: string | null
  lineItems: LineItem[]
  payments: Payment[]
}

export function InvoiceDetail({
  invoice,
  currency,
  garage,
}: {
  invoice: InvoiceData
  currency: string
  garage: { name: string; address: string | null; phone: string | null; logoUrl: string | null }
}) {
  const router = useRouter()
  const [payOpen, setPayOpen] = React.useState(false)
  const [amount, setAmount] = React.useState<number>(invoice.balanceDue)
  const [method, setMethod] = React.useState("Cash")
  const [saving, setSaving] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [, startDeleteTransition] = React.useTransition()

  function handleDelete() {
    startDeleteTransition(async () => {
      const res = await deleteInvoice(invoice.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Invoice ${invoice.number} deleted`)
      router.push("/invoices")
    })
  }

  const pdfData: PdfData = {
    docLabel: "INVOICE",
    number: invoice.number,
    date: formatDate(invoice.date),
    dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
    status: invoice.status,
    garage,
    customer: {
      name: invoice.customer.name,
      phone: invoice.customer.phone,
      address: invoice.customer.address,
    },
    vehicle: invoice.vehicle,
    currency,
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    balanceDue: invoice.balanceDue,
    notes: invoice.notes,
  }

  async function generatePdfBlob() {
    // Dynamically import to keep @react-pdf/renderer out of the server bundle.
    const [{ pdf }, { InvoicePdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/invoice-pdf"),
    ])
    return pdf(<InvoicePdf data={pdfData} />).toBlob()
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await generatePdfBlob()
      const { viaPrintDialog } = await savePdfBlob(blob, `Invoice-${invoice.number}.pdf`)
      if (viaPrintDialog) {
        toast.info('To download, choose "Save as PDF" as the printer in the dialog.')
      }
    } catch {
      toast.error("Could not generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  async function handlePrint() {
    setDownloading(true)
    try {
      const blob = await generatePdfBlob()
      await printPdfBlob(blob)
    } catch {
      toast.error("Could not open PDF")
    } finally {
      setDownloading(false)
    }
  }

  async function handleRecordPayment() {
    if (amount <= 0) {
      toast.error("Enter an amount greater than zero")
      return
    }
    setSaving(true)
    const res = await recordPayment({
      invoiceId: invoice.id,
      amount,
      method: method as "Cash" | "Card" | "Bank Transfer" | "Mobile Wallet",
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setPayOpen(false)
    toast.success("Payment recorded")
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{invoice.number}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill To</p>
                <p className="mt-1 font-medium">{invoice.customer.name}</p>
                <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
                {invoice.customer.address && (
                  <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
                )}
              </div>
              {invoice.vehicle && (
                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Vehicle</p>
                  <p className="mt-1 text-sm">{invoice.vehicle}</p>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((li) => (
                  <TableRow key={li.id}>
                    <TableCell>{li.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{li.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(li.price, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(li.lineTotal, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex w-56 justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(invoice.subtotal, currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex w-56 justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">-{formatCurrency(invoice.discount, currency)}</span>
                </div>
              )}
              <div className="flex w-56 justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(invoice.tax, currency)}</span>
              </div>
              <Separator className="my-1 w-56" />
              <div className="flex w-56 justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(invoice.total, currency)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                {invoice.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.payments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(p.date, true)}
                      </TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions sidebar */}
      <div className="flex flex-col gap-6">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="tabular-nums">{formatCurrency(invoice.total, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="tabular-nums">{formatCurrency(invoice.amountPaid, currency)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-base font-semibold">
                <span>Balance due</span>
                <span
                  className={
                    invoice.balanceDue > 0 ? "tabular-nums text-destructive" : "tabular-nums"
                  }
                >
                  {formatCurrency(invoice.balanceDue, currency)}
                </span>
              </div>
            </div>

            {invoice.balanceDue > 0 && (
              <Button
                onClick={() => {
                  setAmount(invoice.balanceDue)
                  setPayOpen(true)
                }}
              >
                <WalletIcon data-icon="inline-start" />
                Record payment
              </Button>
            )}

            <Separator />

            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <DownloadIcon data-icon="inline-start" />
              )}
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={downloading}>
              Print
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2Icon data-icon="inline-start" />
                    Delete invoice
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete invoice {invoice.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the invoice and its recorded payments. Any parts on
                    this invoice will be returned to inventory stock. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Record payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Balance due is {formatCurrency(invoice.balanceDue, currency)}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pay-amount">Amount</FieldLabel>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                max={invoice.balanceDue}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pay-method">Method</FieldLabel>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Wallet">Mobile Wallet</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={saving}>
              {saving && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
