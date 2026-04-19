# FreshMart PWA 🥦🍎

A complete Progressive Web App for your fruit & vegetable shop.

## Features
- 🛒 **Shop** — Browse products, add to cart, place orders
- 📋 **Orders** — View all orders, mark delivered / paid, export
- 📦 **Stock** — Track opening stock, sold qty, available qty per item
- 💳 **Payments** — Save UPI details shown to customers, track pending payments

## How to Deploy on GitHub Pages (No 404 Error!)

1. Create a **new GitHub repository** (e.g. `freshmart`)
2. Upload **all files** in this folder (keep folder structure intact)
3. Go to **Settings → Pages**
4. Set Source: `Deploy from branch` → `main` → `/ (root)`
5. Your app will be live at: `https://YOUR_USERNAME.github.io/freshmart/`

### Why no 404?
- `manifest.json` uses `"start_url": "./index.html"` (relative path — works on any subdirectory)
- `404.html` handles any direct URL hits and redirects back to app
- Service worker uses relative paths (`./`)

## Files
```
freshmart/
├── index.html       ← Main app
├── manifest.json    ← PWA manifest
├── sw.js            ← Service worker (offline support)
├── 404.html         ← GitHub Pages 404 fix
├── css/
│   └── style.css
├── js/
│   └── app.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Customise Your Shop Name
Open `index.html` and change `FreshMart` to your actual shop name in:
- `<title>` tag
- `.nav-brand` text
- `manifest.json` → `"name"` and `"short_name"`
