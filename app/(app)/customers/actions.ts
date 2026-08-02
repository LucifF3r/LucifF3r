"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export type CustomerActionState = { error?: string; success?: boolean } | null

export async function saveCustomer(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await requireAdmin()

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const id = formData.get("id") as string | null
  const data = {
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  }

  try {
    if (id) {
      await prisma.customer.update({ where: { id }, data })
    } else {
      await prisma.customer.create({ data })
    }
  } catch {
    return { error: "Could not save customer" }
  }

  revalidatePath("/customers")
  if (id) revalidatePath(`/customers/${id}`)
  return { success: true }
}

export async function deleteCustomer(id: string) {
  await requireAdmin()
  try {
    await prisma.customer.delete({ where: { id } })
  } catch {
    return { error: "Cannot delete a customer with existing invoices or quotations." }
  }
  revalidatePath("/customers")
  return { success: true }
}

export async function updateCustomerNotes(id: string, notes: string) {
  await requireAdmin()
  try {
    await prisma.customer.update({ where: { id }, data: { notes: notes || null } })
  } catch {
    return { error: "Could not update notes" }
  }
  revalidatePath(`/customers/${id}`)
  return { success: true }
}

const vehicleSchema = z.object({
  customerId: z.string().min(1),
  makeModel: z.string().trim().min(1, "Make/model is required"),
  plateNumber: z.string().trim().min(1, "Plate number is required"),
  year: z.string().trim().optional(),
})

export async function saveVehicle(_prev: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  await requireAdmin()

  const parsed = vehicleSchema.safeParse({
    customerId: formData.get("customerId"),
    makeModel: formData.get("makeModel"),
    plateNumber: formData.get("plateNumber"),
    year: formData.get("year"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const id = formData.get("id") as string | null
  const yearNum = parsed.data.year ? Number.parseInt(parsed.data.year, 10) : null
  const data = {
    makeModel: parsed.data.makeModel,
    plate: parsed.data.plateNumber,
    year: Number.isFinite(yearNum) ? yearNum : null,
  }

  try {
    if (id) {
      await prisma.vehicle.update({ where: { id }, data })
    } else {
      await prisma.vehicle.create({ data: { ...data, customerId: parsed.data.customerId } })
    }
  } catch {
    return { error: "Could not save vehicle" }
  }

  revalidatePath(`/customers/${parsed.data.customerId}`)
  return { success: true }
}

export async function deleteVehicle(id: string, customerId: string) {
  await requireAdmin()
  try {
    await prisma.vehicle.delete({ where: { id } })
  } catch {
    return { error: "Cannot delete a vehicle linked to invoices." }
  }
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}
