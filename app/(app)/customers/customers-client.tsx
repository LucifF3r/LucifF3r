"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { formatCurrency } from "@/lib/format"
import { saveCustomer, deleteCustomer } from "./actions"

type CustomerRow = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  vehicleCount: number
  invoiceCount: number
  lifetime: number
  outstanding: number
}

export function CustomersClient({
  customers,
  currency,
}: {
  customers: CustomerRow[]
  currency: string
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CustomerRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<CustomerRow | null>(null)
  const [saving, setSaving] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    )
  }, [customers, query])

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(c: CustomerRow) {
    setEditing(c)
    setDialogOpen(true)
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    const result = await saveCustomer(null, formData)
    setSaving(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success(editing ? "Customer updated" : "Customer added")
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteCustomer(deleteTarget.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Customer deleted")
      router.refresh()
    }
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={openAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Customer
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        {filtered.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No customers found</EmptyTitle>
              <EmptyDescription>
                {query ? "Try a different search term." : "Add your first customer to get started."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Vehicles</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-right">Lifetime Spend</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="text-center">{c.vehicleCount}</TableCell>
                  <TableCell className="text-center">{c.invoiceCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(c.lifetime, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.outstanding > 0 ? (
                      <Badge variant="destructive">{formatCurrency(c.outstanding, currency)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label="Edit">
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(c)}
                        aria-label="Delete"
                      >
                        <Trash2Icon className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update customer details." : "Create a new customer record."}
              </DialogDescription>
            </DialogHeader>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                <Input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} />
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address (optional)</FieldLabel>
                <Input id="address" name="address" defaultValue={editing?.address ?? ""} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {editing ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the customer and their vehicles. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
