"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { ArrowLeftIcon, DownloadIcon, FileCheck2Icon, Trash2Icon, Loader2Icon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/format"
import { setQuotationStatus, deleteQuotation, convertToInvoice } from "../actions"
import type { GarageSettings } from "@/lib/settings"

type QuotationData = {
  id: string
  number: string
  date: string
  expiryDate: string | null
  status: string
  convertedInvoiceId: string | null
  notes: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  customer: { name: string; phone: string; email: string | null; address: string | null }
  vehicle: string | null
  lineItems: { id: string; name: string; quantity: number; price: number; lineTotal: number }[]
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Draft: "outline",
  Sent: "secondary",
  Converted: "default",
  Expired: "destructive",
}

export function QuotationDetail({
  quotation,
  garage,
  currency,
}: {
  quotation: QuotationData
  garage: GarageSettings
  currency: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [downloading, setDownloading] = useState(false)
  const isConverted = quotation.status === "Converted"

  function handleStatus(status: "Draft" | "Sent" | "Expired") {
    startTransition(async () => {
      const res = await setQuotationStatus(quotation.id, status)
      if (res?.error) toast.error(res.error)
      else toast.success(`Marked as ${status}`)
    })
  }

  function handleConvert() {
    startTransition(async () => {
      const res = await convertToInvoice(quotation.id)
      if (res?.error) toast.error(res.error)
      // On success the action redirects to the new invoice.
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteQuotation(quotation.id)
      if (res?.error) toast.error(res.error)
    })
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const { InvoicePdf } = await import("@/components/invoice-pdf")
      const blob = await pdf(
        <InvoicePdf
          data={{
            docLabel: "QUOTATION",
            number: quotation.number,
            date: quotation.date,
            dueDate: quotation.expiryDate,
            status: quotation.status,
            garage: {
              name: garage.name,
              address: garage.address,
              phone: garage.phone,
              logoUrl: garage.logoUrl,
            },
            customer: {
              name: quotation.customer.name,
              phone: quotation.customer.phone,
              address: quotation.customer.address,
            },
            vehicle: quotation.vehicle,
            currency,
            lineItems: quotation.lineItems,
            subtotal: quotation.subtotal,
            discount: quotation.discount,
            tax: quotation.tax,
            total: quotation.total,
            notes: quotation.notes,
          }}
        />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quotation.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Could not generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href="/quotations" aria-label="Back" />}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Quotation {quotation.number}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-5 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold">{quotation.number}</span>
                <span className="text-sm text-muted-foreground">{formatDate(quotation.date)}</span>
                {quotation.expiryDate && (
                  <span className="text-xs text-muted-foreground">
                    Valid until {formatDate(quotation.expiryDate)}
                  </span>
                )}
                <Badge variant={STATUS_VARIANT[quotation.status] ?? "outline"} className="mt-1 w-fit">
                  {quotation.status}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-xs font-medium uppercase text-muted-foreground">Prepared for</span>
                <span className="font-medium">{quotation.customer.name}</span>
                <span className="text-sm text-muted-foreground">{quotation.customer.phone}</span>
                {quotation.vehicle && (
                  <span className="text-sm text-muted-foreground">{quotation.vehicle}</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.lineItems.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell className="font-medium">{li.name}</TableCell>
                      <TableCell className="text-center">{li.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(li.price, currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(li.lineTotal, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex w-56 justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quotation.subtotal, currency)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex w-56 justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatCurrency(quotation.discount, currency)}</span>
                </div>
              )}
              <div className="flex w-56 justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(quotation.tax, currency)}</span>
              </div>
              <Separator className="my-1 w-56" />
              <div className="flex w-56 justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(quotation.total, currency)}</span>
              </div>
            </div>

            {quotation.notes && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{quotation.notes}</p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isConverted ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  This quotation has been converted to an invoice.
                </p>
                {quotation.convertedInvoiceId && (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/invoices/${quotation.convertedInvoiceId}`} />}
                  >
                    View invoice
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleConvert} disabled={isPending}>
                {isPending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <FileCheck2Icon data-icon="inline-start" />}
                Convert to Invoice
              </Button>
            )}

            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <DownloadIcon data-icon="inline-start" />}
              Download PDF
            </Button>

            {!isConverted && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Update status</span>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleStatus("Sent")} disabled={isPending}>
                      <SendIcon data-icon="inline-start" />
                      Mark Sent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus("Draft")} disabled={isPending}>
                      Draft
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus("Expired")} disabled={isPending}>
                      Expired
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2Icon data-icon="inline-start" />
                    Delete quotation
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this quotation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes quotation {quotation.number}. This action cannot be undone.
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
    </div>
  )
}
