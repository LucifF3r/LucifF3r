"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  WrenchIcon,
  PackageIcon,
  FileTextIcon,
  ReceiptIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { formatCurrency as formatMoney } from "@/lib/format"
import { createSale, quickCreateCustomer, type SaleResult } from "./actions"
import { cn } from "@/lib/utils"

type Vehicle = { id: string; label: string }
type Customer = { id: string; name: string; phone: string; vehicles: Vehicle[] }
type CatalogService = { id: string; name: string; price: number; category: string }
type CatalogItem = { id: string; name: string; price: number; stock: number; unit: string }

type LineItem = {
  key: string
  kind: "service" | "inventory" | "custom"
  refId: string | null
  name: string
  quantity: number
  price: number
  maxStock?: number
}

export function NewSaleClient({
  currency,
  customers: initialCustomers,
  services,
  inventory,
}: {
  currency: string
  customers: Customer[]
  services: CatalogService[]
  inventory: CatalogItem[]
}) {
  const router = useRouter()
  const [customers, setCustomers] = React.useState(initialCustomers)
  const [docType, setDocType] = React.useState<"invoice" | "quotation">("invoice")

  const [customerId, setCustomerId] = React.useState<string>("")
  const [vehicleId, setVehicleId] = React.useState<string>("")
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [customerOpen, setCustomerOpen] = React.useState(false)

  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [catalogSearch, setCatalogSearch] = React.useState("")
  const [catalogTab, setCatalogTab] = React.useState<"service" | "inventory">("service")

  const [discount, setDiscount] = React.useState<number>(0)
  const [taxRate, setTaxRate] = React.useState<number>(0)
  const [notes, setNotes] = React.useState("")

  const [payStatus, setPayStatus] = React.useState<"full" | "partial" | "none">("full")
  const [amountPaid, setAmountPaid] = React.useState<number>(0)
  const [paymentMethod, setPaymentMethod] = React.useState("Cash")
  const [dueDate, setDueDate] = React.useState("")

  const [quickOpen, setQuickOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customers.slice(0, 8)
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 8)
  }, [customers, customerSearch])

  const catalogResults = React.useMemo(() => {
    const q = catalogSearch.trim().toLowerCase()
    if (catalogTab === "service") {
      return services.filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 30)
    }
    return inventory.filter((i) => !q || i.name.toLowerCase().includes(q)).slice(0, 30)
  }, [catalogSearch, catalogTab, services, inventory])

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.price, 0)
  const taxable = Math.max(0, subtotal - discount)
  const tax = Math.round(taxable * (taxRate / 100) * 100) / 100
  const total = Math.round((taxable + tax) * 100) / 100

  // Keep amountPaid synced with the chosen payment status.
  React.useEffect(() => {
    if (payStatus === "full") setAmountPaid(total)
    else if (payStatus === "none") setAmountPaid(0)
  }, [payStatus, total])

  const balanceDue = Math.max(0, Math.round((total - amountPaid) * 100) / 100)

  function addService(s: CatalogService) {
    setLineItems((prev) => {
      const existing = prev.find((li) => li.kind === "service" && li.refId === s.id)
      if (existing) {
        return prev.map((li) =>
          li.key === existing.key ? { ...li, quantity: li.quantity + 1 } : li,
        )
      }
      return [
        ...prev,
        { key: crypto.randomUUID(), kind: "service", refId: s.id, name: s.name, quantity: 1, price: s.price },
      ]
    })
  }

  function addInventory(i: CatalogItem) {
    if (i.stock <= 0) {
      toast.error(`${i.name} is out of stock`)
      return
    }
    setLineItems((prev) => {
      const existing = prev.find((li) => li.kind === "inventory" && li.refId === i.id)
      if (existing) {
        if (existing.quantity >= i.stock) {
          toast.error(`Only ${i.stock} ${i.unit} of ${i.name} in stock`)
          return prev
        }
        return prev.map((li) =>
          li.key === existing.key ? { ...li, quantity: li.quantity + 1 } : li,
        )
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          kind: "inventory",
          refId: i.id,
          name: i.name,
          quantity: 1,
          price: i.price,
          maxStock: i.stock,
        },
      ]
    })
  }

  function addCustom() {
    setLineItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), kind: "custom", refId: null, name: "", quantity: 1, price: 0 },
    ])
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((li) => (li.key === key ? { ...li, ...patch } : li)))
  }

  function removeLine(key: string) {
    setLineItems((prev) => prev.filter((li) => li.key !== key))
  }

  async function handleQuickAdd(formData: FormData) {
    const res = await quickCreateCustomer({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      makeModel: String(formData.get("makeModel") ?? ""),
      plateNumber: String(formData.get("plateNumber") ?? ""),
    })
    if (res.error || !res.customer) {
      toast.error(res.error ?? "Could not add customer")
      return
    }
    setCustomers((prev) => [res.customer!, ...prev])
    setCustomerId(res.customer.id)
    setVehicleId(res.customer.vehicles[0]?.id ?? "")
    setQuickOpen(false)
    toast.success("Customer added")
  }

  async function handleSubmit() {
    if (!customerId) {
      toast.error("Select a customer first")
      return
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line item")
      return
    }
    if (lineItems.some((li) => !li.name.trim())) {
      toast.error("Every line item needs a name")
      return
    }
    setSubmitting(true)
    const payload = {
      customerId,
      vehicleId: vehicleId || null,
      discount,
      taxRate,
      notes,
      documentType: docType,
      amountPaid: docType === "invoice" ? amountPaid : 0,
      paymentMethod,
      dueDate: dueDate || null,
      lineItems: lineItems.map((li) => ({
        kind: li.kind,
        refId: li.refId,
        name: li.name.trim(),
        quantity: li.quantity,
        price: li.price,
      })),
    }
    const res: SaleResult = await createSale(payload)
    setSubmitting(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(docType === "invoice" ? "Invoice created" : "Quotation created")
    if (res.documentType === "quotation") router.push(`/quotations/${res.id}`)
    else router.push(`/invoices/${res.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* LEFT: customer + catalog + line items */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedCustomer ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomerId("")
                    setVehicleId("")
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customer by name or phone…"
                  className="pl-9"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setCustomerOpen(true)
                  }}
                  onFocus={() => setCustomerOpen(true)}
                />
                {customerOpen && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                    {filteredCustomers.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-muted-foreground">No customers found.</p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setCustomerId(c.id)
                            setVehicleId(c.vehicles[0]?.id ?? "")
                            setCustomerOpen(false)
                            setCustomerSearch("")
                          }}
                        >
                          <span>{c.name}</span>
                          <span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setQuickOpen(true)}>
                <UserPlusIcon data-icon="inline-start" />
                Quick add customer
              </Button>
              {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Vehicle</Label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger size="sm" className="min-w-48">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomer.vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                value={[catalogTab]}
                onValueChange={(v) => {
                  const next = Array.isArray(v) ? v[0] : v
                  if (next) setCatalogTab(next as "service" | "inventory")
                }}
              >
                <ToggleGroupItem value="service">
                  <WrenchIcon data-icon="inline-start" />
                  Services
                </ToggleGroupItem>
                <ToggleGroupItem value="inventory">
                  <PackageIcon data-icon="inline-start" />
                  Parts
                </ToggleGroupItem>
              </ToggleGroup>
              <Button variant="outline" size="sm" onClick={addCustom}>
                <PlusIcon data-icon="inline-start" />
                Custom line
              </Button>
            </div>

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={catalogTab === "service" ? "Search services…" : "Search parts…"}
                className="pl-9"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>

            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {catalogTab === "service"
                ? catalogResults.map((s) => {
                    const svc = s as CatalogService
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => addService(svc)}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-accent/50"
                      >
                        <span className="truncate pr-2">{svc.name}</span>
                        <span className="shrink-0 font-medium text-muted-foreground">
                          {formatMoney(svc.price, currency)}
                        </span>
                      </button>
                    )
                  })
                : catalogResults.map((i) => {
                    const item = i as CatalogItem
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addInventory(item)}
                        disabled={item.stock <= 0}
                        className={cn(
                          "flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-accent/50",
                          item.stock <= 0 && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.stock} {item.unit} in stock
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-muted-foreground">
                          {formatMoney(item.price, currency)}
                        </span>
                      </button>
                    )
                  })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line items</CardTitle>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No items yet. Add services or parts above.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="hidden grid-cols-[1fr_90px_120px_120px_40px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>
                {lineItems.map((li) => (
                  <div
                    key={li.key}
                    className="grid grid-cols-2 items-center gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_90px_120px_120px_40px] sm:border-0 sm:p-1"
                  >
                    <div className="col-span-2 sm:col-span-1">
                      {li.kind === "custom" ? (
                        <Input
                          placeholder="Description"
                          value={li.name}
                          onChange={(e) => updateLine(li.key, { name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {li.kind === "inventory" ? (
                            <PackageIcon className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <WrenchIcon className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-sm">{li.name}</span>
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className="text-center"
                      value={li.quantity}
                      onChange={(e) => {
                        let q = Number(e.target.value) || 1
                        if (li.maxStock && q > li.maxStock) {
                          q = li.maxStock
                          toast.error(`Only ${li.maxStock} in stock`)
                        }
                        updateLine(li.key, { quantity: Math.max(1, q) })
                      }}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      className="text-right"
                      value={li.price}
                      onChange={(e) => updateLine(li.key, { price: Math.max(0, Number(e.target.value) || 0) })}
                    />
                    <span className="text-right text-sm font-medium tabular-nums">
                      {formatMoney(li.quantity * li.price, currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLine(li.key)}
                      aria-label="Remove line"
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: summary + payment */}
      <div className="flex flex-col gap-6">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ToggleGroup
              className="w-full"
              value={[docType]}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v
                if (next) setDocType(next as "invoice" | "quotation")
              }}
            >
              <ToggleGroupItem value="invoice" className="flex-1">
                <ReceiptIcon data-icon="inline-start" />
                Invoice
              </ToggleGroupItem>
              <ToggleGroupItem value="quotation" className="flex-1">
                <FileTextIcon data-icon="inline-start" />
                Quotation
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Discount</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-8 w-28 text-right"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Tax %</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  className="h-8 w-28 text-right"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tax amount</span>
                <span className="tabular-nums">{formatMoney(tax, currency)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total, currency)}</span>
              </div>
            </div>

            {docType === "invoice" && (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">Payment</Label>
                  <ToggleGroup
                    className="w-full"
                    value={[payStatus]}
                    onValueChange={(v) => {
                      const next = Array.isArray(v) ? v[0] : v
                      if (next) setPayStatus(next as "full" | "partial" | "none")
                    }}
                  >
                    <ToggleGroupItem value="full" className="flex-1 text-xs">
                      Paid
                    </ToggleGroupItem>
                    <ToggleGroupItem value="partial" className="flex-1 text-xs">
                      Partial
                    </ToggleGroupItem>
                    <ToggleGroupItem value="none" className="flex-1 text-xs">
                      Unpaid
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {payStatus === "partial" && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Amount paid</span>
                      <Input
                        type="number"
                        min={0}
                        max={total}
                        step="0.01"
                        className="h-8 w-28 text-right"
                        value={amountPaid}
                        onChange={(e) =>
                          setAmountPaid(Math.min(total, Math.max(0, Number(e.target.value) || 0)))
                        }
                      />
                    </div>
                  )}

                  {payStatus !== "none" && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Method</span>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger size="sm" className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Mobile Wallet">Mobile Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {payStatus !== "full" && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Due date</span>
                      <Input
                        type="date"
                        className="h-8 w-40"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Balance due</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(balanceDue, currency)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <Textarea
              placeholder="Notes (optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button size="lg" disabled={submitting} onClick={handleSubmit}>
              {submitting && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
              {docType === "invoice" ? "Create Invoice" : "Create Quotation"}
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {formatMoney(total, currency)}
              </Badge>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick add customer dialog */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add customer</DialogTitle>
            <DialogDescription>Add a customer and optional vehicle on the fly.</DialogDescription>
          </DialogHeader>
          <form action={handleQuickAdd} id="quick-add-form">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="qa-name">Name</FieldLabel>
                <Input id="qa-name" name="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="qa-phone">Phone</FieldLabel>
                <Input id="qa-phone" name="phone" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="qa-make">Make / Model (optional)</FieldLabel>
                <Input id="qa-make" name="makeModel" placeholder="Honda CB125" />
              </Field>
              <Field>
                <FieldLabel htmlFor="qa-plate">Plate number (optional)</FieldLabel>
                <Input id="qa-plate" name="plateNumber" placeholder="P1234" />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="quick-add-form">
              Add customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
