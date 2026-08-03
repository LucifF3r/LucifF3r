"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

const profileSchema = z.object({
  name: z.string().min(1, "Garage name is required").max(120),
  // Accepts an uploaded image (base64 data URL), an existing http(s) URL, or empty.
  logoUrl: z
    .string()
    .max(3_000_000, "Logo image is too large — please use a smaller file")
    .refine(
      (v) => v === "" || v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Invalid logo image",
    )
    .optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  currencySymbol: z.string().min(1).max(8),
  taxRate: z.coerce.number().min(0, "Cannot be negative").max(100, "Too high"),
})

export async function updateGarageProfile(_prev: unknown, formData: FormData) {
  await requireAdmin()

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl") ?? "",
    address: formData.get("address") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    currencySymbol: formData.get("currencySymbol"),
    taxRate: formData.get("taxRate"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const existing = await prisma.garageProfile.findFirst()
  const data = {
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl || null,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    currencySymbol: parsed.data.currencySymbol,
    taxRate: parsed.data.taxRate,
  }

  if (existing) {
    await prisma.garageProfile.update({ where: { id: existing.id }, data })
  } else {
    await prisma.garageProfile.create({ data })
  }

  revalidatePath("/settings")
  revalidatePath("/", "layout")
  return { success: "Business profile updated" }
}

const nameSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(80),
})

export async function updateAdminName(_prev: unknown, formData: FormData) {
  const session = await requireAdmin()

  const parsed = nameSchema.safeParse({ displayName: formData.get("displayName") })
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const adminId = session.user?.id as string | undefined
  const admin = adminId
    ? await prisma.admin.findUnique({ where: { id: adminId } })
    : await prisma.admin.findUnique({ where: { email: session.user?.email ?? "" } })

  if (!admin) return { error: "Account not found" }

  await prisma.admin.update({ where: { id: admin.id }, data: { name: parsed.data.displayName } })

  revalidatePath("/", "layout")
  return { success: "Display name updated. Sign out and back in to refresh it everywhere." }
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })

export async function changePassword(_prev: unknown, formData: FormData) {
  const session = await requireAdmin()

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const adminId = session.user?.id as string | undefined
  const admin = adminId
    ? await prisma.admin.findUnique({ where: { id: adminId } })
    : await prisma.admin.findUnique({ where: { email: session.user?.email ?? "" } })

  if (!admin) return { error: "Account not found" }

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash)
  if (!valid) return { error: "Current password is incorrect" }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } })

  return { success: "Password changed successfully" }
}
