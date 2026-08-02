"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, Minus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { Empty } from "@/components/ui/empty"
import { formatCurrency } from "@/lib/format"
import { saveInventoryItem, adjustStock, deleteInventoryItem } from "./actions"

type InventoryRow = {
  id: string
  name: string
  sku: string | null
  category: string | null
  costPrice: number
  sellingPrice: number
  quantity: number
  lowStockThreshold: number
  unit: string
}

export function InventoryClient({
  items,
  categories,
  currency,
}: {
  items: InventoryRow[]
  categories: string[]
  currency: string
}) {
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const lowStockCount = items.filter((i) => i.quantity <= i.lowStockThreshold).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      const matchesQuery =
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.sku ?? "").toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || i.category === categoryFilter
      const matchesLow = !showLowOnly || i.quantity <= i.lowStockThreshold
      return matchesQuery && matchesCategory && matchesLow
    })
  }, [items, query, categoryFilter, showLowOnly])

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: InventoryRow) {
    setEditing(row)
    setDialogOpen(true)
  }

  function handleSubmit(formData: FormData) {
    const payload = {
      id: editing?.id,
      name: String(formData.get("name") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      category: String(formData.get("category") ?? ""),
      costPrice: Number.parseFloat(String(formData.get("costPrice") ?? "0")) || 0,
      sellingPrice: Number.parseFloat(String(formData.get("sellingPrice") ?? "0")) || 0,
      quantity: Number.parseInt(String(formData.get("quantity") ?? "0")) || 0,
      lowStockThreshold: Number.parseInt(String(formData.get("lowStockThreshold") ?? "0")) || 0,
      unit: String(formData.get("unit") ?? "pcs"),
    }
    startTransition(async () => {
      const res = await saveInventoryItem(payload)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(editing ? "Item updated" : "Item added")
      setDialogOpen(false)
      setEditing(null)
    })
  }

  function handleAdjust(row: InventoryRow, delta: number) {
    startTransition(async () => {
      await adjustStock(row.id, delta)
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      await deleteInventoryItem(target.id)
      toast.success("Item deleted")
      setDeleteTarget(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory" description="Track parts, stock levels, and pricing.">
        <Button onClick={openNew}>
          <Plus data-icon="inline-start" />
          Add Item
        </Button>
      </PageHeader>

      {lowStockCount > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 text-destructive" />
            <p className="text-sm">
              <span className="font-medium">{lowStockCount}</span> item{lowStockCount > 1 ? "s are" : " is"} at or
              below the low-stock threshold.
            </p>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setShowLowOnly((v) => !v)}>
              {showLowOnly ? "Show all" : "Show low stock"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, category..."
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
          </div>

          {filtered.length === 0 ? (
            <Empty className="py-12">
              <Package className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No inventory items found.</p>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const low = row.quantity <= row.lowStockThreshold
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{row.name}</span>
                            {row.category ? (
                              <span className="text-xs text-muted-foreground">{row.category}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.sku ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(row.costPrice, currency)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.sellingPrice, currency)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleAdjust(row, -1)}
                              disabled={row.quantity <= 0}
                              aria-label="Decrease stock"
                            >
                              <Minus />
                            </Button>
                            <Badge variant={low ? "destructive" : "secondary"} className="min-w-14 justify-center">
                              {row.quantity} {row.unit}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleAdjust(row, 1)}
                              aria-label="Increase stock"
                            >
                              <Plus />
                            </Button>
                          </div>
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update this inventory item." : "Add a new part or product to inventory."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="sku">SKU</FieldLabel>
                  <Input id="sku" name="sku" defaultValue={editing?.sku ?? ""} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={editing?.category ?? ""}
                    list="inventory-categories"
                  />
                  <datalist id="inventory-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="costPrice">Cost Price</FieldLabel>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.costPrice ?? 0}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sellingPrice">Selling Price</FieldLabel>
                  <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.sellingPrice ?? 0}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                  <Input id="quantity" name="quantity" type="number" min="0" defaultValue={editing?.quantity ?? 0} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lowStockThreshold">Low Stock At</FieldLabel>
                  <Input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    defaultValue={editing?.lowStockThreshold ?? 5}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="unit">Unit</FieldLabel>
                  <Input id="unit" name="unit" defaultValue={editing?.unit ?? "pcs"} />
                </Field>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {editing ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &quot;{deleteTarget?.name}&quot; from inventory.
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
