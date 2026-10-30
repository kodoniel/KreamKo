# 🍦 Kream Ko — Stall Stock & Sales Counter

A private, mobile-first web app and Progressive Web App (PWA) built for **Kream Ko**, an ice cream, floats, fries, and hotdog stall in the Philippines. Designed for 2–3 people (Admin and Counter Staff) working simultaneously on mobile phones at the counter.

---

## 🎨 Design Philosophy & Core Principles

1. **Strict Separation of Sales and Stock:**
   - Recording an ice cream or float sale **never** automatically deducts stock.
   - Ice cream portions vary (scoop sizes, soft-serve pull lengths, ice ratios), making automatic recipe deductions inaccurate in practice.
   - Stock is counted physically in whole **packs, bottles, boxes, rolls, or pouches** via stepping (`+1`/`−1`), typed counts, restocks, wastage logs, and closing End-of-Day (EOD) counts.
2. **Offline-First Resilience:**
   - If mall or stall Wi-Fi drops, counter staff can continue recording sales, adjusting stock, logging wastage, and completing counts with zero interruption.
   - Changes queue locally in **IndexedDB (via Dexie.js)** and automatically sync to Neon PostgreSQL via idempotent client UUIDs and delta-based stock adjustments.
3. **Pastel Stall Brand Identity:**
   - Soft Cream (`#FFF8F0`), Strawberry Pastel Pink (`#FFB5C2`), Mint Green (`#A8E6CF`), and Mango Yellow (`#FFE0A3`).
   - Quicksand display typography with large **48px+ thumb-friendly tap targets** built for fast mobile counter work.
4. **Messenger-First Closing:**
   - A single tap on the dashboard copies a clean, formatted daily sales & cash summary to the clipboard ready to paste into Facebook Messenger or Viber for the stall owner.

---

## 🚀 Daily Stall Counter Workflow

### 1. Opening the Stall (Morning)
1. Staff or Admin logs in at `https://kreamko.ph` (or opens the installed home screen PWA).
2. Check the **Dashboard** (`/`) for any **Low Stock Alerts** or supplies that need to be prepped.
3. Go to **Counter Sales** (`/sales`). If any flavors are unavailable for the day, an Admin can tap **Flavors Today** to toggle them off instantly.

### 2. Taking Orders at the Counter (`/sales`)
1. Tap any menu item card (e.g. *Ice Cream Regular Cone*, *Strawberry Float*, *French Fries Large*).
2. In the modal, pick the flavor, size, and optional add-ons (+₱5) or dips (+₱8).
3. Tap **Add to Order**.
4. In the cart drawer, select payment method: **Cash** (default) or **E-Wallet**.
5. Tap **Record Sale (₱XX.XX)**. The order is snapshot and recorded instantly.

### 3. Restocking & Wastage (`/inventory`)
- **Quick Adjust:** Tap `+1` or `−1` on any stock item card for quick stepping, or tap the number to type a physical count.
- **Restock:** Tap the restock icon on an item, enter quantity added (e.g. 5 packs) and optional purchase cost.
- **Log Wastage:** Tap **Log Wastage** to record dropped cones, spoiled mix, or spilled cups. This automatically decreases stock inventory and logs estimated financial loss.
- **What to Buy:** Tap **What to buy** to view all items at or below low stock, and copy a formatted grocery list to Messenger.

### 4. Closing the Stall (Night)
1. **End-of-Day Stock Count (`/inventory` &rarr; `EOD Count`):**
   - Count the remaining packs/bottles on the shelves.
   - Tap **Save Closing Count**. The app reconciles usage against the previous day's closing count.
2. **Daily Cash Count (`/sales` &rarr; `Cash Count`):**
   - Enter starting cash (change fund).
   - Enter physical cash counted from the drawer.
   - The app verifies: `Starting Cash + Today's Cash Sales = Expected Cash`.
   - Any difference is highlighted as **Short** or **Over** (E-Wallet is tracked separately).
3. **Send Summary to Owner (`/`):**
   - Return to the **Dashboard**.
   - Tap **Copy Summary**.
   - Open Facebook Messenger / Viber and paste:
     ```text
     🍦 Kream Ko Summary — Oct 30, 2026
     ━━━━━━━━━━━━━━━━━━━━━━
     💰 Total Sales: ₱4,230.00
        • Cash: ₱3,100.00
        • E-Wallet: ₱1,130.00
     🧾 Orders: 86 (112 items sold)
     ⭐ Top Seller: Strawberry Float (34)
     🍨 Top Flavor: Mango (42)

     💵 Cash Drawer:
        Expected: ₱3,100.00 | Counted: ₱3,090.00 (-₱10.00 Short)

     🗑️ Wastage Today: 3 items (~₱145.00 loss)

     ⚠️ Low Stock:
     • Dome lids 16oz: 0 packs [OUT OF STOCK]
     • 16 oz cups: 2 packs
     ━━━━━━━━━━━━━━━━━━━━━━
     ```

---

## 📱 PWA & Offline Usage Guide

### Installing on Mobile Devices
- **Android (Chrome):** Open the stall URL &rarr; Tap the 3 dots menu &rarr; Tap **Add to Home screen** / **Install app**.
- **iOS / iPhone (Safari):** Open the stall URL &rarr; Tap the Share icon &rarr; Tap **Add to Home Screen**.

### How Offline Mode Works
- When the device loses internet connection, the header badge updates to yellow **Offline**.
- Sales, stock adjustments, wastage, and closing counts are written immediately to **Dexie (IndexedDB)**.
- When connection returns, the badge transitions to **Syncing...** and writes all queued transactions to PostgreSQL.
- Stock adjustments use **delta math (`+/−`)** rather than absolute numbers, ensuring two staff members counting stock simultaneously will not overwrite each other's updates.

---

## 👥 Role Permissions

| Action | Admin | Staff |
|---|:---:|:---:|
| Take Orders & Record Sales (Cash / E-Wallet) | ✅ | ✅ |
| Adjust Stock (+/−, Typed Count, Restock) | ✅ | ✅ |
| Log Wastage & View Shopping List | ✅ | ✅ |
| Submit End-of-Day Stock & Cash Counts | ✅ | ✅ |
| Toggle Daily Flavor Availability | ✅ | ❌ |
| Add, Edit, or Archive Stock Items | ✅ | ❌ |
| View Cash Drawer Shortage / Overage History | ✅ | ❌ |
| View Gross Margins & Profit Estimates | ✅ | ❌ |
| Generate 48-Hour Staff Invite Links | ✅ | ❌ |

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (Free serverless PostgreSQL at [neon.tech](https://neon.tech))

### 2. Installation
```bash
git clone https://github.com/your-username/kream-ko.git
cd kream-ko
npm install
```

### 3. Environment Variables
Copy the template:
```bash
cp .env.example .env
```

Configure your `.env`:
```env
# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://[user]:[password]@[host].ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Auth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-32-char-random-jwt-secret-string"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Initial Admin User (automatically seeded)
ADMIN_INITIAL_EMAIL="admin@kreamko.ph"
ADMIN_INITIAL_PASSWORD="YourSecurePassword123!"
ADMIN_INITIAL_NAME="Kream Ko Admin"

# Timezone
NEXT_PUBLIC_TIMEZONE="Asia/Manila"
```

### 4. Database Setup & Seed
```bash
# Push schema to database
npm run db:push

# Seed with all 63 stall stock items, 18 menu products, and Admin user
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and sign in with `admin@kreamko.ph`.

---

## ☁️ Free-Tier Production Deployment Guide (Render.com)

### ⚠️ Why Render.com instead of Vercel?
- **Vercel's Free "Hobby" Tier prohibits commercial use:** Vercel's Terms of Service explicitly restrict the Hobby plan to personal, non-commercial projects. Running a commercial business counter app on Vercel Free violates their TOS and risks account suspension.
- **Render.com's Free Web Service Tier allows commercial applications:** Render provides free web service hosting and allows production commercial apps on their free tier, making it ideal for a small local food stall.

---

### Step-by-Step Render.com Deployment

#### 1. Push Code to GitHub
Ensure your repository is pushed to GitHub:
```bash
git init
git add .
git commit -m "Initial Kream Ko build"
git branch -M main
git remote add origin https://github.com/your-username/kream-ko.git
git push -u origin main
```

#### 2. Create Web Service on Render
1. Sign up / log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; Select **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name:** `kream-ko`
   - **Region:** `Singapore` (closest to the Philippines for lowest latency)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** `Free`

#### 3. Add Environment Variables in Render
In the Render dashboard under **Environment**, add the following environment variables:

| Key | Value / Source |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Neon pooled connection string (with `sslmode=require`) |
| `AUTH_SECRET` | 32+ character random string |
| `NEXT_PUBLIC_APP_URL` | `https://kream-ko.onrender.com` (or your custom domain) |
| `ADMIN_INITIAL_EMAIL` | Stall admin email |
| `ADMIN_INITIAL_PASSWORD` | Strong admin password |
| `ADMIN_INITIAL_NAME` | Stall Admin Name |
| `NEXT_PUBLIC_TIMEZONE` | `Asia/Manila` |

#### 4. Run Seed Script Once
Once your deployment succeeds, run the seed script from the **Render Shell** tab or locally with your production `DATABASE_URL`:
```bash
npm run db:seed
```

Your stall counter is now live at `https://kream-ko.onrender.com`!

---

## 🔮 Future Roadmap ("Later Ideas")

The application is architected to allow adding the following planned expansions when the stall grows:

1. **Recipe Auto-Deductions (Optional Toggle):**
   - Enable an optional flag on menu products (e.g. *Hotdog Bun*, *Hotdog Stick*) to auto-deduct 1 unit upon sale, while keeping soft-serve ice cream manual.
2. **Discounts & Promo Engine:**
   - 20% Senior Citizen / PWD legal discount button.
   - Combo meal vouchers and seasonal promo codes.
3. **Thermal Receipt Printing:**
   - Web Bluetooth or WebUSB integration with 58mm / 80mm ESC/POS thermal printers for fast customer receipts and order slips.
4. **Barcode & QR Scanner:**
   - Scan ingredient boxes or retail packs during stock deliveries directly using the phone camera.
5. **Automated Closing Bot Webhooks:**
   - Send the daily closing summary automatically to a Telegram channel or Facebook Messenger Group chat via webhook at 10:00 PM every evening.
6. **Cash Drawer Hardware Trigger:**
   - Kick cash drawer open via receipt printer RJ11 pulse on cash sales.

---

## 📜 License

Private internal software for **Kream Ko**. All rights reserved.
