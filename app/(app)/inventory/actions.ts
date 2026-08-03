"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export type InventoryInput = {
  id?: string
  name: string
  sku?: string
  category?: string
  costPrice: number
  sellingPrice: number
  quantity: number
  lowStockThreshold: number
  unit: string
}

export async function saveInventoryItem(input: InventoryInput) {
  await requireAdmin()

  const name = input.name.trim()
  if (!name) return { error: "Item name is required." }

  const sku = input.sku?.trim() || null
  if (sku) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { sku, NOT: input.id ? { id: input.id } : undefined },
    })
    if (existing) return { error: "SKU is already in use by another item." }
  }

  const data = {
    name,
    sku,
    category: input.category?.trim() || null,
    costPrice: Math.max(0, Number(input.costPrice) || 0),
    sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
    quantity: Math.max(0, Math.trunc(Number(input.quantity) || 0)),
    lowStockThreshold: Math.max(0, Math.trunc(Number(input.lowStockThreshold) || 0)),
    unit: input.unit?.trim() || "pcs",
  }

  if (input.id) {
    await prisma.inventoryItem.update({ where: { id: input.id }, data })
  } else {
    await prisma.inventoryItem.create({ data })
  }

  revalidatePath("/inventory")
  return { success: true }
}

export async function adjustStock(id: string, delta: number) {
  await requireAdmin()
  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) return { error: "Item not found." }
  const next = Math.max(0, item.quantity + Math.trunc(delta))
  await prisma.inventoryItem.update({ where: { id }, data: { quantity: next } })
  revalidatePath("/inventory")
  return { success: true }
}

export async function deleteInventoryItem(id: string) {
  await requireAdmin()
  await prisma.inventoryItem.delete({ where: { id } })
  revalidatePath("/inventory")
  return { success: true }
}
