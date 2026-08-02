"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Empty } from "@/components/ui/empty"
import { formatCurrency } from "@/lib/format"
import { saveService, toggleServiceActive, deleteService } from "./actions"

type ServiceRow = {
  id: string
  name: string
  description: string | null
  defaultPrice: number
  category: string | null
  active: boolean
}

export function ServicesClient({
  services,
  categories,
  currency,
}: {
  services: ServiceRow[]
  categories: string[]
  currency: string
}) {
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return services.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || (s.category ?? "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.active) ||
        (statusFilter === "inactive" && !s.active)
      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [services, query, categoryFilter, statusFilter])

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: ServiceRow) {
    setEditing(row)
    setDialogOpen(true)
  }

  function handleSubmit(formData: FormData) {
    const payload = {
      id: editing?.id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      defaultPrice: Number.parseFloat(String(formData.get("defaultPrice") ?? "0")) || 0,
      category: String(formData.get("category") ?? ""),
      active: formData.get("active") === "on",
    }
    startTransition(async () => {
      const res = await saveService(payload)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(editing ? "Service updated" : "Service added")
      setDialogOpen(false)
      setEditing(null)
    })
  }

  function handleToggle(row: ServiceRow, next: boolean) {
    startTransition(async () => {
      await toggleServiceActive(row.id, next)
      toast.success(next ? "Service activated" : "Service deactivated")
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      await deleteService(target.id)
      toast.success("Service deleted")
      setDeleteTarget(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Services" description="Manage the service catalog, pricing, and availability.">
        <Button onClick={openNew}>
          <Plus data-icon="inline-start" />
          Add Service
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Empty className="py-12">
              <Wrench className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No services found.</p>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Default Price</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.name}</span>
                          {row.description ? (
                            <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.category ? (
                          <Badge variant="secondary">{row.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(row.defaultPrice, currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.active}
                          onCheckedChange={(v) => handleToggle(row, v)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(row)}
                            aria-label="Delete"
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update the service details below." : "Add a new service to the catalog."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required autoFocus />
              </Field>
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editing?.category ?? ""}
                  placeholder="e.g. Maintenance"
                  list="service-categories"
                />
                <datalist id="service-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field>
                <FieldLabel htmlFor="defaultPrice">Default Price ({currency.trim()})</FieldLabel>
                <Input
                  id="defaultPrice"
                  name="defaultPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.defaultPrice ?? 0}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editing?.description ?? ""}
                  rows={2}
                />
              </Field>
              <Field orientation="horizontal">
                <Switch id="active" name="active" defaultChecked={editing?.active ?? true} />
                <div className="flex flex-col">
                  <FieldLabel htmlFor="active">Active</FieldLabel>
                  <FieldDescription>Inactive services are hidden from new sales.</FieldDescription>
                </div>
              </Field>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {editing ? "Save Changes" : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.name}&quot;. Existing invoices are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
