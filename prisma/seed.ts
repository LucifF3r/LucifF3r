import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const DEFAULT_ADMIN_EMAIL = "admin@garage.com"
const DEFAULT_ADMIN_PASSWORD = "admin123"

const defaultServices: { name: string; price: number; category: string }[] = [
  { name: "Oil Change", price: 250, category: "Maintenance" },
  { name: "Washing / Detailing", price: 150, category: "Cleaning" },
  { name: "General Servicing", price: 400, category: "Maintenance" },
  { name: "Full Servicing", price: 750, category: "Maintenance" },
  { name: "Engine Tuning & Overhaul", price: 1500, category: "Engine" },
  { name: "Brake Pad/Shoe Replacement", price: 350, category: "Brakes" },
  { name: "Chain & Sprocket Replacement", price: 600, category: "Transmission" },
  { name: "Tire/Tube Change & Puncture Repair", price: 200, category: "Tires" },
  { name: "Battery Check & Replacement", price: 300, category: "Electrical" },
  { name: "Electrical/Wiring Repair", price: 450, category: "Electrical" },
  { name: "Clutch Repair & Adjustment", price: 500, category: "Transmission" },
  { name: "Suspension & Fork Service", price: 700, category: "Suspension" },
  { name: "Wheel Alignment & Balancing", price: 250, category: "Tires" },
  { name: "Denting & Painting", price: 1200, category: "Bodywork" },
  { name: "Spare Part Installation", price: 150, category: "General" },
  { name: "Vehicle Diagnostic/Inspection", price: 200, category: "Diagnostics" },
  { name: "Custom/Other Service", price: 0, category: "General" },
]

const serviceCategories = [
  "Maintenance",
  "Cleaning",
  "Engine",
  "Brakes",
  "Transmission",
  "Tires",
  "Electrical",
  "Suspension",
  "Bodywork",
  "Diagnostics",
  "General",
]

const inventoryCategories = ["Oils & Fluids", "Filters", "Brakes", "Tires", "Electrical", "Chains", "Spares"]

async function main() {
  // Admin
  const existingAdmin = await prisma.admin.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)
    await prisma.admin.create({ data: { email: DEFAULT_ADMIN_EMAIL, passwordHash } })
    console.log(`Created admin: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`)
  }

  // Garage profile
  const profileCount = await prisma.garageProfile.count()
  if (profileCount === 0) {
    await prisma.garageProfile.create({
      data: {
        name: "RideWorks Garage",
        address: "Majeedhee Magu, Male' 20025, Maldives",
        phone: "+960 330-1234",
        email: "service@rideworks.mv",
        currencySymbol: "MVR",
        taxRate: 0,
      },
    })
  }

  // Services
  const serviceCount = await prisma.service.count()
  if (serviceCount === 0) {
    for (const s of defaultServices) {
      await prisma.service.create({
        data: { name: s.name, defaultPrice: s.price, category: s.category, active: true },
      })
    }
    console.log(`Seeded ${defaultServices.length} services`)
  }

  // Categories
  for (const name of serviceCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: "service" },
    })
  }
  for (const name of inventoryCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: "inventory" },
    })
  }

  // Sample inventory
  const invCount = await prisma.inventoryItem.count()
  if (invCount === 0) {
    await prisma.inventoryItem.createMany({
      data: [
        { name: "10W-40 Engine Oil (1L)", sku: "OIL-1040", category: "Oils & Fluids", costPrice: 80, sellingPrice: 130, quantity: 40, lowStockThreshold: 10, unit: "bottle" },
        { name: "Oil Filter", sku: "FLT-OIL", category: "Filters", costPrice: 25, sellingPrice: 55, quantity: 25, lowStockThreshold: 8, unit: "pcs" },
        { name: "Air Filter", sku: "FLT-AIR", category: "Filters", costPrice: 40, sellingPrice: 90, quantity: 6, lowStockThreshold: 8, unit: "pcs" },
        { name: "Front Brake Pads", sku: "BRK-FP", category: "Brakes", costPrice: 120, sellingPrice: 220, quantity: 15, lowStockThreshold: 5, unit: "set" },
        { name: "Drive Chain", sku: "CHN-STD", category: "Chains", costPrice: 200, sellingPrice: 380, quantity: 4, lowStockThreshold: 5, unit: "pcs" },
        { name: "Spark Plug", sku: "ELC-SP", category: "Electrical", costPrice: 30, sellingPrice: 70, quantity: 50, lowStockThreshold: 15, unit: "pcs" },
        { name: "Tube 90/90-17", sku: "TIR-TUBE", category: "Tires", costPrice: 60, sellingPrice: 120, quantity: 20, lowStockThreshold: 6, unit: "pcs" },
        { name: "12V Battery", sku: "ELC-BAT", category: "Electrical", costPrice: 350, sellingPrice: 550, quantity: 3, lowStockThreshold: 4, unit: "pcs" },
      ],
    })
    console.log("Seeded sample inventory")
  }

  // Counters for sequential numbering
  await prisma.counter.upsert({ where: { id: "invoice" }, update: {}, create: { id: "invoice", value: 1000 } })
  await prisma.counter.upsert({ where: { id: "quotation" }, update: {}, create: { id: "quotation", value: 5000 } })

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
