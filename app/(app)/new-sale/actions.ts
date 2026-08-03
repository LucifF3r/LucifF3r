"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { nextSequence, formatQuotationNumber } from "@/lib/counter"

const lineItemSchema = z.object({
  kind: z.enum(["service", "inventory", "custom"]),
  refId: z.string().nullable().optional(),
  name: z.string().trim().min(1),
  quantity: z.number().positive().max(100000),
  price: z.number().min(0),
})

const saleSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  vehicleId: z.string().nullable().optional(),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  // invoice-only fields
  amountPaid: z.number().min(0).default(0),
  paymentMethod: z.string().default("Cash"),
  dueDate: z.string().nullable().optional(),
  documentType: z.enum(["invoice", "quotation"]).default("invoice"),
})

export type SaleResult = { error?: string; id?: string; documentType?: "invoice" | "quotation" }

function computeTotals(
  lineItems: { quantity: number; price: number }[],
  discount: number,
  taxRate: number,
) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.price, 0)
  const taxable = Math.max(0, subtotal - discount)
  const tax = Math.round(taxable * (taxRate / 100) * 100) / 100
  const total = Math.round((taxable + tax) * 100) / 100
  return { subtotal: Math.round(subtotal * 100) / 100, tax, total }
}

export async function createSale(raw: unknown): Promise<SaleResult> {
  await requireAdmin()

  const parsed = saleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid sale data" }
  }
  const data = parsed.data

  // Recompute all money server-side from validated inputs — never trust client totals.
  const { subtotal, tax, total } = computeTotals(data.lineItems, data.discount, data.taxRate)
  const amountPaid = Math.min(data.amountPaid, total)

  try {
    if (data.documentType === "quotation") {
      const quotation = await prisma.$transaction(async (tx) => {
        const seq = await nextSequence(tx, "quotation")
        return tx.quotation.create({
          data: {
            number: seq,
            customerId: data.customerId,
            vehicleId: data.vehicleId || null,
            subtotal,
            discount: data.discount,
            tax,
            total,
            status: "Draft",
            expiryDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes || null,
            lineItems: {
              create: data.lineItems.map((li) => ({
                kind: li.kind,
                refId: li.refId || null,
                name: li.name,
                quantity: li.quantity,
                price: li.price,
                lineTotal: Math.round(li.quantity * li.price * 100) / 100,
              })),
            },
          },
        })
      })
      revalidatePath("/quotations")
      return { id: quotation.id, documentType: "quotation" }
    }

    // Invoice path — deduct stock and record payment atomically.
    const invoice = await prisma.$transaction(async (tx) => {
      // Validate + deduct inventory stock for inventory line items.
      for (const li of data.lineItems) {
        if (li.kind === "inventory" && li.refId) {
          const item = await tx.inventoryItem.findUnique({ where: { id: li.refId } })
          if (!item) throw new Error(`Inventory item not found: ${li.name}`)
          if (item.quantity < li.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (have ${item.quantity})`)
          }
          await tx.inventoryItem.update({
            where: { id: li.refId },
            data: { quantity: { decrement: Math.round(li.quantity) } },
          })
        }
      }

      const seq = await nextSequence(tx, "invoice")
      const balanceDue = Math.round((total - amountPaid) * 100) / 100
      const status = balanceDue <= 0 ? "Paid" : amountPaid > 0 ? "Partial" : "Outstanding"

      return tx.invoice.create({
        data: {
          number: seq,
          customerId: data.customerId,
          vehicleId: data.vehicleId || null,
          subtotal,
          discount: data.discount,
          tax,
          total,
          amountPaid,
          balanceDue,
          status,
          paymentMethod: amountPaid > 0 ? data.paymentMethod : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes || null,
          lineItems: {
            create: data.lineItems.map((li) => ({
              kind: li.kind,
              refId: li.refId || null,
              name: li.name,
              quantity: li.quantity,
              price: li.price,
              lineTotal: Math.round(li.quantity * li.price * 100) / 100,
            })),
          },
          payments:
            amountPaid > 0
              ? { create: [{ amount: amountPaid, method: data.paymentMethod }] }
              : undefined,
        },
      })
    })

    revalidatePath("/invoices")
    revalidatePath("/inventory")
    revalidatePath("/")
    return { id: invoice.id, documentType: "invoice" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create sale"
    return { error: message }
  }
}

// Quick-add a customer from within the sale screen.
const quickCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  makeModel: z.string().trim().optional(),
  plateNumber: z.string().trim().optional(),
})

export async function quickCreateCustomer(raw: unknown) {
  await requireAdmin()
  const parsed = quickCustomerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const { name, phone, makeModel, plateNumber } = parsed.data
  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        vehicles:
          makeModel && plateNumber
            ? { create: [{ makeModel, plate: plateNumber }] }
            : undefined,
      },
      include: { vehicles: true },
    })
    revalidatePath("/customers")
    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        vehicles: customer.vehicles.map((v) => ({
          id: v.id,
          label: `${v.makeModel} (${v.plate})`,
        })),
      },
    }
  } catch {
    return { error: "Could not create customer" }
  }
}
