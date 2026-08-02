import { prisma } from "@/lib/prisma"

export type GarageSettings = {
  id: string
  name: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  currency: string
  taxRate: number
}

/**
 * Loads the single garage profile row, creating it with defaults if missing.
 * Maps the Prisma `GarageProfile` model to a clean `GarageSettings` shape.
 */
export async function getGarageSettings(): Promise<GarageSettings> {
  let profile = await prisma.garageProfile.findFirst()
  if (!profile) {
    profile = await prisma.garageProfile.create({
      data: { name: "MotoGarage", currencySymbol: "MVR", taxRate: 0 },
    })
  }
  return {
    id: profile.id,
    name: profile.name,
    logoUrl: profile.logoUrl,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    currency: profile.currencySymbol,
    taxRate: profile.taxRate,
  }
}
