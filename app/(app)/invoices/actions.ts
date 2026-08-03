"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.enum(["Cash", "Card", "Bank Transfer", "Mobile Wallet"]),
  note: z.string().optional(),
})

export async function recordPayment(raw: unknown) {
  await requireAdmin()
  const parsed = paymentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment" }
  }
  const { invoiceId, amount, method } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
      if (!invoice) throw new Error("Invoice not found")

      const roundedAmount = Math.round(amount * 100) / 100
      // Never allow overpayment beyond the balance due.
      const applied = Math.min(roundedAmount, invoice.balanceDue)
      if (applied <= 0) throw new Error("Invoice is already fully paid")

      const newPaid = Math.round((invoice.amountPaid + applied) * 100) / 100
      const newBalance = Math.round((invoice.total - newPaid) * 100) / 100
      const status = newBalance <= 0 ? "Paid" : "Partial"

      await tx.payment.create({
        data: { invoiceId, amount: applied, method },
      })
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          balanceDue: newBalance,
          status,
          paymentMethod: method,
        },
      })
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record payment" }
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
  revalidatePath("/outstanding")
  revalidatePath("/")
  return { success: true }
}

export async function deleteInvoice(id: string) {
  await requireAdmin()
  try {
    // Restore inventory stock for any inventory line items before deleting.
    await prisma.$transaction(async (tx) => {
      const items = await tx.lineItem.findMany({ where: { invoiceId: id } })
      for (const li of items) {
        if (li.kind === "inventory" && li.refId) {
          await tx.inventoryItem.update({
            where: { id: li.refId },
            data: { quantity: { increment: Math.round(li.quantity) } },
          }).catch(() => {})
        }
      }
      await tx.invoice.delete({ where: { id } })
    })
  } catch {
    return { error: "Could not delete invoice" }
  }
  revalidatePath("/invoices")
  revalidatePath("/inventory")
  return { success: true }
}
