"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, BikeIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { formatCurrency, formatDate } from "@/lib/format"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { saveVehicle, deleteVehicle, updateCustomerNotes } from "../actions"

type Vehicle = { id: string; makeModel: string; plateNumber: string; year: number | null }
type InvoiceRow = {
  id: string
  invoiceNumber: string
  date: string
  vehicle: string | null
  total: number
  amountPaid: number
  status: string
}

export function CustomerProfile({
  customer,
  vehicles,
  invoices,
  stats,
  currency,
}: {
  customer: { id: string; name: string; phone: string; email: string | null; address: string | null; notes: string | null }
  vehicles: Vehicle[]
  invoices: InvoiceRow[]
  stats: { lifetime: number; outstanding: number; totalBilled: number; invoiceCount: number }
  currency: string
}) {
  const router = useRouter()
  const [vehicleDialog, setVehicleDialog] = React.useState(false)
  const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null)
  const [notes, setNotes] = React.useState(customer.notes ?? "")
  const [savingNotes, setSavingNotes] = React.useState(false)

  async function handleVehicleSubmit(formData: FormData) {
    const result = await saveVehicle(null, formData)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingVehicle ? "Vehicle updated" : "Vehicle added")
    setVehicleDialog(false)
    setEditingVehicle(null)
    router.refresh()
  }

  async function handleDeleteVehicle(id: string) {
    const result = await deleteVehicle(id, customer.id)
    if (result?.error) toast.error(result.error)
    else {
      toast.success("Vehicle removed")
      router.refresh()
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    const result = await updateCustomerNotes(customer.id, notes)
    setSavingNotes(false)
    if (result?.error) toast.error(result.error)
    else toast.success("Notes saved")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lifetime Spend" value={formatCurrency(stats.lifetime, currency)} />
        <StatCard label="Total Billed" value={formatCurrency(stats.totalBilled, currency)} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding, currency)}
          highlight={stats.outstanding > 0}
        />
        <StatCard label="Invoices" value={String(stats.invoiceCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: contact + notes */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <InfoRow label="Phone" value={customer.phone} />
              <InfoRow label="Email" value={customer.email ?? "—"} />
              <InfoRow label="Address" value={customer.address ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes for this customer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
              />
              <Button
                size="sm"
                className="self-start"
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === (customer.notes ?? "")}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: vehicles + history */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Vehicles</CardTitle>
                <CardDescription>Motorbikes registered to this customer.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingVehicle(null)
                  setVehicleDialog(true)
                }}
              >
                <PlusIcon data-icon="inline-start" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No vehicles yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                          <BikeIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{v.makeModel}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.plateNumber}
                            {v.year ? ` · ${v.year}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit vehicle"
                          onClick={() => {
                            setEditingVehicle(v)
                            setVehicleDialog(true)
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete vehicle"
                          onClick={() => handleDeleteVehicle(v.id)}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>All sales and invoices for this customer.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {invoices.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BikeIcon />
                    </EmptyMedia>
                    <EmptyTitle>No invoices yet</EmptyTitle>
                    <EmptyDescription>This customer has no sales history.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(inv.date)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(inv.total, currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(inv.total - inv.amountPaid, currency)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicle dialog */}
      <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
        <DialogContent>
          <form action={handleVehicleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
              <DialogDescription>Motorbike details for this customer.</DialogDescription>
            </DialogHeader>
            <input type="hidden" name="customerId" value={customer.id} />
            {editingVehicle && <input type="hidden" name="id" value={editingVehicle.id} />}
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="makeModel">Make / Model</FieldLabel>
                <Input
                  id="makeModel"
                  name="makeModel"
                  placeholder="e.g. Honda CB150R"
                  defaultValue={editingVehicle?.makeModel ?? ""}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="plateNumber">Plate Number</FieldLabel>
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  placeholder="e.g. P1234"
                  defaultValue={editingVehicle?.plateNumber ?? ""}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="year">Year (optional)</FieldLabel>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  placeholder="e.g. 2022"
                  defaultValue={editingVehicle?.year ?? ""}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVehicleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingVehicle ? "Save" : "Add Vehicle"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums ${highlight ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
