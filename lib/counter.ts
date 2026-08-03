import type { Prisma } from "@prisma/client"

/**
 * Atomically increments a named counter and returns the next sequential value.
 * Must be called inside a Prisma transaction so the read-modify-write is safe
 * against concurrent sales. Guarantees unique, gap-free-ish sequential numbers.
 */
export async function nextSequence(tx: Prisma.TransactionClient, key: "invoice" | "quotation"): Promise<number> {
  const counter = await tx.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  })
  return counter.value
}

/** Formats an invoice number like INV-000123. */
export function formatInvoiceNumber(n: number): string {
  return `INV-${String(n).padStart(6, "0")}`
}

/** Formats a quotation number like QUO-000123. */
export function formatQuotationNumber(n: number): string {
  return `QUO-${String(n).padStart(6, "0")}`
}
