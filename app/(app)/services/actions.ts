"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export type ServiceInput = {
  id?: string
  name: string
  description?: string
  defaultPrice: number
  category?: string
  active: boolean
}

export async function saveService(input: ServiceInput) {
  await requireAdmin()

  const name = input.name.trim()
  if (!name) return { error: "Service name is required." }

  const data = {
    name,
    description: input.description?.trim() || null,
    defaultPrice: Number.isFinite(input.defaultPrice) ? Math.max(0, input.defaultPrice) : 0,
    category: input.category?.trim() || null,
    active: input.active,
  }

  if (input.id) {
    await prisma.service.update({ where: { id: input.id }, data })
  } else {
    await prisma.service.create({ data })
  }

  revalidatePath("/services")
  return { success: true }
}

export async function toggleServiceActive(id: string, active: boolean) {
  await requireAdmin()
  await prisma.service.update({ where: { id }, data: { active } })
  revalidatePath("/services")
  return { success: true }
}

export async function deleteService(id: string) {
  await requireAdmin()
  await prisma.service.delete({ where: { id } })
  revalidatePath("/services")
  return { success: true }
}
