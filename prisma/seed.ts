/**
 * Database Seed Script for Kream Ko
 *
 * Seeds:
 * 1. Initial Admin User
 * 2. All 52 Stock Items with realistic starter counts & unit labels
 * 3. Menu Products & Variants (with daily availability toggle)
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STOCK_ITEMS_SEED = [
  // Ice cream powders
  { name: "Vanilla Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Mango Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Strawberry Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Chocolate Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 6, lowStock: 2 },
  { name: "Ube Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 3, lowStock: 2 },
  { name: "Matcha Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 3, lowStock: 2 },
  { name: "Avocado Ice Cream Powder", category: "Ice cream powders", unitLabel: "pack", qty: 4, lowStock: 2 },

  // Syrups
  { name: "Chocolate Syrup", category: "Syrups", unitLabel: "bottle", qty: 4, lowStock: 2 },
  { name: "Strawberry Syrup", category: "Syrups", unitLabel: "bottle", qty: 3, lowStock: 2 },
  { name: "Caramel Syrup", category: "Syrups", unitLabel: "bottle", qty: 3, lowStock: 2 },
  { name: "Mango Syrup", category: "Syrups", unitLabel: "bottle", qty: 2, lowStock: 2 },

  // Float ingredients
  { name: "Chocolate Powder (Float)", category: "Float ingredients", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Coffee Powder (Float)", category: "Float ingredients", unitLabel: "pack", qty: 3, lowStock: 2 },
  { name: "Coke (Can/L)", category: "Float ingredients", unitLabel: "pcs", qty: 12, lowStock: 4 },
  { name: "Sprite (Can/L)", category: "Float ingredients", unitLabel: "pcs", qty: 10, lowStock: 4 },
  { name: "Chuckie", category: "Float ingredients", unitLabel: "pcs", qty: 8, lowStock: 3 },
  { name: "Dutchmill", category: "Float ingredients", unitLabel: "pcs", qty: 8, lowStock: 3 },
  { name: "Green Apple Syrup", category: "Float ingredients", unitLabel: "bottle", qty: 3, lowStock: 1 },
  { name: "Strawberry Syrup (Float)", category: "Float ingredients", unitLabel: "bottle", qty: 2, lowStock: 1 },
  { name: "Blueberry Syrup", category: "Float ingredients", unitLabel: "bottle", qty: 2, lowStock: 1 },
  { name: "Coke Mismo", category: "Float ingredients", unitLabel: "bottle", qty: 12, lowStock: 4 },
  { name: "Coke Swakto", category: "Float ingredients", unitLabel: "bottle", qty: 12, lowStock: 4 },
  { name: "Royal Swakto", category: "Float ingredients", unitLabel: "bottle", qty: 8, lowStock: 3 },

  // Toppings
  { name: "Sprinkles", category: "Toppings", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Marshmallow", category: "Toppings", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Nips", category: "Toppings", unitLabel: "pack", qty: 3, lowStock: 1 },
  { name: "Chocolate Chips", category: "Toppings", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Oreo Crumbs", category: "Toppings", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Graham Powder", category: "Toppings", unitLabel: "pack", qty: 5, lowStock: 2 },

  // Snacks
  { name: "Fries", category: "Snacks", unitLabel: "pack", qty: 10, lowStock: 3 },
  { name: "Hotdog", category: "Snacks", unitLabel: "pack", qty: 8, lowStock: 3 },
  { name: "Hotdog Bun", category: "Snacks", unitLabel: "pack", qty: 6, lowStock: 2 },
  { name: "Cooking oil (1 L)", category: "Snacks", unitLabel: "bottle", qty: 0, lowStock: 2 },

  // Cones
  { name: "Fun Cones", category: "Cones", unitLabel: "box", qty: 5, lowStock: 2 },
  { name: "Sugar Cones", category: "Cones", unitLabel: "box", qty: 4, lowStock: 2 },
  { name: "Tissue for Cones", category: "Cones", unitLabel: "pack", qty: 6, lowStock: 2 },

  // Cups & lids
  { name: "16 oz Cup", category: "Cups & lids", unitLabel: "pack", qty: 6, lowStock: 2 },
  { name: "22 oz Cup", category: "Cups & lids", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Dome Lids", category: "Cups & lids", unitLabel: "pack", qty: 6, lowStock: 2 },
  { name: "5 oz Cup with Lid", category: "Cups & lids", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Sundae Cups", category: "Cups & lids", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Take-out Sundae Cups", category: "Cups & lids", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Sundae Spoon", category: "Cups & lids", unitLabel: "pack", qty: 8, lowStock: 3 },

  // Straws
  { name: "Bendable Straw", category: "Straws", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Boba Straw", category: "Straws", unitLabel: "pack", qty: 4, lowStock: 2 },

  // Packaging
  { name: "Take-out Cellophane (Single)", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Take-out Cellophane (Double)", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Bulsita", category: "Packaging", unitLabel: "pack", qty: 5, lowStock: 2 },
  { name: "Hotdog Cellophane", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Fries Cellophane (Small)", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Fries Cellophane (Large)", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },
  { name: "Hotdog Stick", category: "Packaging", unitLabel: "pack", qty: 6, lowStock: 2 },
  { name: "Hotdog Disposable Plate", category: "Packaging", unitLabel: "pack", qty: 4, lowStock: 2 },

  // Fries seasoning
  { name: "BBQ Powder", category: "Fries seasoning", unitLabel: "pack", qty: 3, lowStock: 1 },
  { name: "Chili BBQ Powder", category: "Fries seasoning", unitLabel: "pack", qty: 2, lowStock: 1 },
  { name: "Sour Cream Powder", category: "Fries seasoning", unitLabel: "pack", qty: 3, lowStock: 1 },
  { name: "Cheese Powder", category: "Fries seasoning", unitLabel: "pack", qty: 4, lowStock: 1 },

  // Condiments
  { name: "Mayonnaise", category: "Condiments", unitLabel: "pouch", qty: 4, lowStock: 2 },
  { name: "Ketchup", category: "Condiments", unitLabel: "pouch", qty: 4, lowStock: 2 },

  // Supplies
  { name: "Paper Towel", category: "Supplies", unitLabel: "roll", qty: 6, lowStock: 2 },
  { name: "Alcohol", category: "Supplies", unitLabel: "bottle", qty: 3, lowStock: 1 },
  { name: "Sticker Logo", category: "Supplies", unitLabel: "roll", qty: 2, lowStock: 1 },

  // Water
  { name: "Bottled Water", category: "Water", unitLabel: "pcs", qty: 15, lowStock: 5 },
  { name: "Gallons of Water", category: "Water", unitLabel: "gallon", qty: 4, lowStock: 2 },
];

async function main() {
  console.log("🍦 Kream Ko — Database Seeder Starting...");
  console.log("──────────────────────────────────────────");

  // 1. Initial Admin User
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@kreamko.ph";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "KreamKoAdmin2026!";
  const adminName = process.env.ADMIN_INITIAL_NAME || "Kream Ko Admin";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin user exists: ${existingAdmin.email}`);
  }

  // 2. Stock Items
  console.log(`📦 Checking ${STOCK_ITEMS_SEED.length} stock items...`);
  let addedCount = 0;
  for (const item of STOCK_ITEMS_SEED) {
    const existing = await prisma.stockItem.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.stockItem.create({
        data: {
          name: item.name,
          category: item.category,
          unitLabel: item.unitLabel,
          currentQuantity: item.qty,
          lowStockLevel: item.lowStock,
          isActive: true,
        },
      });
      addedCount++;
    }
  }
  console.log(`✅ Stock items seeded: ${addedCount} added, total ${STOCK_ITEMS_SEED.length}`);

  // 3. Menu Products & Variants
  console.log("🍨 Checking Menu Products & Variants...");
  const MENU_PRODUCTS_SEED = [
    {
      name: "Happy Cone",
      category: "Ice Cream",
      sortOrder: 1,
      variants: [
        { name: "Vanilla", price: 15 },
        { name: "Chocolate", price: 15 },
        { name: "Strawberry", price: 15 },
        { name: "Mango", price: 15 },
        { name: "Avocado", price: 15 },
        { name: "Matcha", price: 15 },
        { name: "Ube", price: 15 },
      ],
    },
    {
      name: "Sweet Cone",
      category: "Ice Cream",
      sortOrder: 2,
      variants: [
        { name: "Vanilla", price: 25 },
        { name: "Chocolate", price: 25 },
        { name: "Strawberry", price: 25 },
        { name: "Mango", price: 25 },
        { name: "Avocado", price: 25 },
        { name: "Matcha", price: 25 },
        { name: "Ube", price: 25 },
      ],
    },
    {
      name: "Ice Cream Tub",
      category: "Ice Cream Tub",
      sortOrder: 3,
      variants: [
        { name: "Strawberry", price: 25 },
        { name: "Chocolate", price: 25 },
        { name: "Matcha", price: 25 },
        { name: "Mango", price: 25 },
        { name: "Avocado", price: 25 },
      ],
    },
    {
      name: "Sundae Classic",
      category: "Sundae",
      sortOrder: 4,
      variants: [
        { name: "Strawberry", price: 35 },
        { name: "Chocolate", price: 35 },
        { name: "Caramel", price: 35 },
      ],
    },
    {
      name: "Sundae Premium",
      category: "Sundae",
      sortOrder: 5,
      variants: [
        { name: "Cookies & Cream", price: 39 },
        { name: "Mango", price: 39 },
      ],
    },
    {
      name: "Green Apple Soda Float",
      category: "Floats",
      sortOrder: 6,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Coke Float",
      category: "Floats",
      sortOrder: 7,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Sprite Float",
      category: "Floats",
      sortOrder: 8,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Chuckie Float",
      category: "Floats",
      sortOrder: 9,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Strawberry Soda Float",
      category: "Floats",
      sortOrder: 10,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Blueberry Soda Float",
      category: "Floats",
      sortOrder: 11,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Dutchmill Float",
      category: "Floats",
      sortOrder: 12,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Triple Chocolate Float",
      category: "Floats",
      sortOrder: 13,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "Coffee Float",
      category: "Floats",
      sortOrder: 14,
      variants: [
        { name: "Grande", price: 49 },
        { name: "Venti", price: 59 },
      ],
    },
    {
      name: "French Fries",
      category: "French Fries",
      sortOrder: 15,
      variants: [
        { name: "Regular - Sour Cream", price: 39 },
        { name: "Large - Sour Cream", price: 59 },
        { name: "Regular - BBQ", price: 39 },
        { name: "Large - BBQ", price: 59 },
        { name: "Regular - Chili BBQ", price: 39 },
        { name: "Large - Chili BBQ", price: 59 },
        { name: "Regular - Cheese", price: 39 },
        { name: "Large - Cheese", price: 59 },
      ],
    },
    {
      name: "Hotdog",
      category: "Hotdog",
      sortOrder: 16,
      variants: [
        { name: "Stick", price: 25 },
        { name: "In A Bun", price: 35 },
      ],
    },
    {
      name: "Add-ons",
      category: "Add-ons",
      sortOrder: 17,
      variants: [
        { name: "Sprinkles", price: 5 },
        { name: "Marshmallow", price: 5 },
        { name: "Cookies", price: 5 },
        { name: "Graham", price: 5 },
      ],
    },
    {
      name: "Dips",
      category: "Dips",
      sortOrder: 18,
      variants: [
        { name: "Chocolate Dip", price: 8 },
        { name: "Matcha Dip", price: 8 },
      ],
    },
  ];

  let menuCount = 0;
  for (const prod of MENU_PRODUCTS_SEED) {
    const existing = await prisma.menuProduct.findFirst({
      where: { name: prod.name },
    });
    if (!existing) {
      const createdProd = await prisma.menuProduct.create({
        data: {
          name: prod.name,
          category: prod.category,
          sortOrder: prod.sortOrder,
          isActive: true,
        },
      });

      for (let i = 0; i < prod.variants.length; i++) {
        const v = prod.variants[i];
        await prisma.menuVariant.create({
          data: {
            productId: createdProd.id,
            name: v.name,
            price: v.price,
            isAvailable: true,
            isActive: true,
            sortOrder: i,
          },
        });
      }
      menuCount++;
    }
  }
  console.log(`✅ Menu products seeded: ${menuCount} added, total ${MENU_PRODUCTS_SEED.length}`);

  console.log("──────────────────────────────────────────");
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
