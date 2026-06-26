# AURUM Luxury Boutique — Full Stack E-Commerce App

A complete luxury e-commerce platform built with **React** + **Supabase**, featuring a customer storefront, cart system, authentication, and a full owner admin panel.

---

## ✨ Features

### Customer Side
- 🏠 **Homepage** — Hero banner, category showcase, featured products, brand promise section
- 🛍 **Shop** — Full product catalogue with category filters, price/rating sort, search
- 💎 **Product Detail** — Large display, quantity selector, add to cart, wishlist
- 🛒 **Cart** — Live subtotal + 18% GST, quantity management, checkout
- 👤 **Auth** — Customer sign up / sign in / sign out (Supabase Auth)
- 🔍 **Search** — Real-time search across product name and brand

### Owner / Admin Side
- 🔑 **Owner Login** — Separate portal with role-based access (demo: owner@aurum.com / owner123)
- 📊 **Dashboard** — Product count, inventory value, low-stock alerts, recent orders, category breakdown
- 💎 **Product Management** — Add / edit / delete products with emoji icons, tags, badges, stock
- 📦 **Order Management** — View all orders, update order status

---

## 🗂 Project Structure

```
aurum-luxury/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js + .module.css
│   │   ├── Footer.js + .module.css
│   │   ├── ProductCard.js + .module.css
│   │   ├── ProductModal.js + .module.css
│   │   └── ToastContainer.js
│   ├── hooks/
│   │   ├── useAuth.js       ← Auth context (Supabase + demo fallback)
│   │   └── useCart.js       ← Cart context (localStorage persistence)
│   ├── lib/
│   │   ├── supabase.js      ← Supabase client
│   │   ├── productService.js ← Product CRUD
│   │   ├── orderService.js  ← Order operations
│   │   └── mockData.js      ← Fallback data (works without Supabase)
│   ├── pages/
│   │   ├── HomePage.js + .module.css
│   │   ├── ShopPage.js + .module.css
│   │   ├── ProductPage.js + .module.css
│   │   ├── CartPage.js + .module.css
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── OwnerLoginPage.js
│   │   ├── AuthPage.module.css  ← shared auth styles
│   │   ├── AdminPage.js + .module.css
│   │   └── NotFoundPage.js + .module.css
│   ├── App.js               ← Router, providers, toast system
│   └── index.js
├── supabase_schema.sql      ← Run this in Supabase SQL Editor
├── .env.example
└── package.json
```

---

## 🚀 Setup Instructions

### 1. Install dependencies
```bash
cd aurum-luxury
npm install
```

### 2. Configure Supabase (optional — app works in demo mode without it)

**a.** Create a free project at [supabase.com](https://supabase.com)

**b.** In the Supabase dashboard, go to **SQL Editor** and run the entire contents of `supabase_schema.sql`

**c.** Copy your credentials from **Settings → API**:
```
Project URL  → REACT_APP_SUPABASE_URL
Anon Key     → REACT_APP_SUPABASE_ANON_KEY
```

**d.** Create your `.env` file:
```bash
cp .env.example .env
# Fill in your values
```

**e.** Create the owner account:
- Go to Supabase Dashboard → **Authentication → Users → Invite User**
- Enter `owner@aurum.com` with password `owner123`
- Then run in SQL Editor:
  ```sql
  UPDATE public.profiles SET role = 'owner' WHERE email = 'owner@aurum.com';
  ```

### 3. Start the development server
```bash
npm start
```

App opens at **http://localhost:3000**

---

## 🎭 Demo Mode (No Supabase Required)

If `REACT_APP_SUPABASE_URL` is not set, the app runs fully in **demo mode**:
- 10 pre-loaded luxury products across 4 categories
- Login with any email + 6-char password → creates a demo session
- Owner login: `owner@aurum.com` / `owner123`
- Add/edit/delete products works (in-memory only, resets on refresh)
- Cart persists via `localStorage`

---

## 🗄 Database Schema (Supabase)

| Table         | Description                                      |
|---------------|--------------------------------------------------|
| `profiles`    | Extends auth.users with `role` (customer/owner)  |
| `products`    | Product catalogue with category, price, stock    |
| `orders`      | Customer orders with status tracking             |
| `order_items` | Line items per order                             |
| `wishlist`    | User wishlist (user × product)                   |

### Row Level Security
- **Products** — Public read; owner-only write
- **Orders** — Users see own orders; owners see all
- **Profiles** — Users see/edit own profile only

---

## 🎨 Design System

| Token         | Value                    |
|---------------|--------------------------|
| `--gold`      | `#C9A84C`                |
| `--gold-dark` | `#9B7D2F`                |
| `--charcoal`  | `#1A1714`                |
| `--cream`     | `#FAF8F3`                |
| Display font  | Cormorant Garamond       |
| Body font     | Montserrat               |

---

## 🏗 Build for Production

```bash
npm run build
```

Output goes to the `build/` folder — deploy to **Vercel**, **Netlify**, or any static host.

### Deploy to Vercel (recommended)
```bash
npm install -g vercel
vercel
# Set env vars in Vercel dashboard
```

---

## 📝 Environment Variables

| Variable                      | Required | Description              |
|-------------------------------|----------|--------------------------|
| `REACT_APP_SUPABASE_URL`      | Optional | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Optional | Your Supabase anon key    |

---

## 📄 License

MIT — feel free to use this as a base for your luxury e-commerce project.
