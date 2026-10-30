/**
 * Idempotent script to add "Cooking oil (1 L)" to the existing database.
 * Does not overwrite or reset any existing data.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.stockItem.findFirst({
    where: { name: "Cooking oil (1 L)" },
  });

  if (existing) {
    console.log(`ℹ️ "Cooking oil (1 L)" already exists in database (ID: ${existing.id}). No changes made.`);
    return;
  }

  const created = await prisma.stockItem.create({
    data: {
      name: "Cooking oil (1 L)",
      category: "Snacks",
      unitLabel: "bottle",
      currentQuantity: 0,
      lowStockLevel: 2,
      isActive: true,
    },
  });

  console.log(`✅ "Cooking oil (1 L)" successfully created (ID: ${created.id}).`);
}

main()
  .catch((e) => {
    console.error("❌ Error adding stock item:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

