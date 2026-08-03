"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { nextSequence } from "@/lib/counter"

export async function setQuotationStatus(id: string, status: "Draft" | "Sent" | "Expired") {
  await requireAdmin()
  try {
    await prisma.quotation.update({ where: { id }, data: { status } })
  } catch {
    return { error: "Could not update status" }
  }
  revalidatePath("/quotations")
  revalidatePath(`/quotations/${id}`)
  return { success: true }
}

export async function deleteQuotation(id: string) {
  await requireAdmin()
  try {
    await prisma.quotation.delete({ where: { id } })
  } catch {
    return { error: "Could not delete quotation" }
  }
  revalidatePath("/quotations")
  redirect("/quotations")
}

export async function convertToInvoice(quotationId: string) {
  await requireAdmin()

  let newInvoiceId: string | null = null

  try {
    newInvoiceId = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id: quotationId },
        include: { lineItems: true },
      })
      if (!quotation) throw new Error("not found")
      if (quotation.status === "Converted") throw new Error("already converted")

      // Deduct inventory stock for any inventory line items on conversion.
      for (const li of quotation.lineItems) {
        if (li.kind === "inventory" && li.refId) {
          const item = await tx.inventoryItem.findUnique({ where: { id: li.refId } })
          if (item) {
            await tx.inventoryItem.update({
              where: { id: li.refId },
              data: { quantity: { decrement: Math.round(li.quantity) } },
            })
          }
        }
      }

      const seq = await nextSequence(tx, "invoice")

      const invoice = await tx.invoice.create({
        data: {
          number: seq,
          customerId: quotation.customerId,
          vehicleId: quotation.vehicleId,
          date: new Date(),
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          tax: quotation.tax,
          total: quotation.total,
          amountPaid: 0,
          balanceDue: quotation.total,
          status: "Outstanding",
          notes: quotation.notes,
          lineItems: {
            create: quotation.lineItems.map((li) => ({
              kind: li.kind,
              refId: li.refId,
              name: li.name,
              description: li.description,
              quantity: li.quantity,
              price: li.price,
              lineTotal: li.lineTotal,
            })),
          },
        },
      })

      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: "Converted", convertedInvoiceId: invoice.id },
      })

      return invoice.id
    })
  } catch (err) {
    const message = err instanceof Error && err.message === "already converted"
      ? "This quotation has already been converted."
      : "Could not convert quotation to invoice."
    return { error: message }
  }

  revalidatePath("/quotations")
  revalidatePath("/invoices")
  if (newInvoiceId) redirect(`/invoices/${newInvoiceId}`)
  return { success: true }
}
