# Diyaar Store (Portal)

The phone app for **store teams** on Diyaar. Owners and staff use it to accept orders, keep the menu up to date, follow sales and see their earnings.
It talks to the live Diyaar backend (`diyaar_backend`) through the same store-portal endpoints as the web admin panel at
`https://diyaar-app.easytouch.cloud/admin_panel/store/dashboard`.

The app stays small on purpose: anything a store rarely does (creating categories, branding, payout accounts, documents) is managed on the web panel.
Diyaar's banners and promotions are read-only here: Diyaar runs them, and the app reads the same customer-API endpoints as the customer app (`src/api/services/banners.ts`).

## Quick start

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:8090 — sign in with a real store account
```

In the browser, the dev server forwards `/api` and `/files` to the backend, so the session cookie stays on one origin.

## Mobile app (iOS & Android)

The app ships as a native app called **Diyaar Store** (`so.diyaar.store`), built with Capacitor 8 like the customer and driver apps.

```bash
npm run ios        # build → sync → open Xcode (then ▶ Run on a simulator or iPhone)
npm run android    # build → sync → open Android Studio
npm run cap:sync   # after any web change, copy it into both native projects
npm run assets     # regenerate icons & splash from assets/*.png
```

The interface (`src/mobile/`) is built with [Konsta UI](https://konstaui.com) using the **iOS theme on every device**, so iPhone and Android look the same.
To preview the Material look in a browser for comparison, open `http://localhost:8090/login?theme=material`.

The app is set up to feel native:
- **Safe areas:** the top bar sits below the notch or Dynamic Island, and the tab bar sits above the home indicator.
- **Haptics:** tapping a tab, accepting an order, a new order arriving, and errors all give a short vibration.
- **Status bar:** its text color follows light or dark mode.
- **Splash screen:** stays up until the session is restored.
- **Android back button:** closes an open sheet first, then goes back a page, and leaves the app from Home.

Icon and splash sources are in `assets/` (lime `#BEFF00` with the Diyaar hand, and dark `#2B330F` for dark mode).

## Screens

| Screen        | What the store does there | Backend |
|---------------|---------------------------|---------|
| Sign in       | Code sent to the phone, or email and password | `admin_send_otp`, `admin_verify_otp`, `admin_login` |
| Home          | Open / closed switch, live order counts, today's sales, 7-day trend, recent orders | `get_store_dashboard`, `update_store_settings` |
| Orders        | Accept → cooking → ready (→ picked up for pickup orders), history with search | `get_orders`, `get_order_details`, `update_store_order_status` |
| Products      | Add and edit items, photo, sale price, sold-out switch, CSV import / export | `get_products`, `create_product`, `update_product`, `delete_product`, `get_categories`, `upload_store_image` |
| Categories    | Browse the store's categories (read-only) and open their items | `get_categories` |
| Promotions    | Diyaar's live offers (read-only) | `customer_api.get_promotions` |
| Banners       | Diyaar's Home banners, the store's own marked (read-only) | `customer_api.get_banners` |
| Earnings      | Earnings to be paid, this month, commission, payout accounts | `get_store_earnings`, `get_store_settings` |
| Reviews       | Rating summary and reviews by stars | `get_store_reviews` |
| Store Profile | Tagline, description, contact, minimum order, prep time (sent for approval) | `get_store_settings`, `submit_store_edit_request` |
| Opening Hours | Weekly schedule (sent for approval) | `get_store_settings`, `submit_store_edit_request` |
| Team          | Owners add staff (email + password) and turn their access on or off | `get_admin_users`, `create_admin_user`, `update_admin_user` |
| Settings      | Auto-accept orders, new-order sound (saved on the phone), appearance | `update_store_settings` |

**Navigation:** a 5-item bottom bar: **Menu** · Home · Orders · Products · Earnings. **Menu** opens a sheet with the other screens.
**New orders:** a chime plays, a toast appears, and counts refresh every 15 seconds.

## Project structure

```
src/
  api/
    endpoints.ts      ← every backend endpoint the app calls
    client.ts         ← one client: session cookie + CSRF token, errors, uploads
    map.ts            ← turns backend rows into the app's types
    types.ts          ← data shapes the screens use
    services/         ← one file per area (orders, catalog, money, …)
  hooks/queries.ts    ← React Query hooks used by screens
  mobile/             ← the app: MobileApp (tabs, Menu sheet, transitions), ui kit, screens/
  pages/Login.tsx     ← sign in
  components/         ← logo, status badge and the few shadcn pieces the login uses
  lib/                ← env, formatting, CSV, native helpers, device preferences
```

Screens call **hooks**, hooks call **services**, and services call **`api`**. Only the services know the backend's field names.

## Environment (.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `https://diyaar-app.easytouch.cloud` | Backend the phone app calls |
| `VITE_API_METHOD_PATH` | `/api/method/diyaar_backend.admin_api` | Frappe module for the store-portal endpoints |
| `VITE_API_TIMEOUT_MS` | `20000` | Request timeout |
| `VITE_DEFAULT_CURRENCY` / `VITE_DEFAULT_LOCALE` | `USD` / `en-US` | Money and number formatting |
| `PORTAL_DEV_PORT` | `8090` | Dev server port |
| `PORTAL_DEV_PROXY_TARGET` | *(the live backend)* | Where the dev server forwards `/api` and `/files`, e.g. `http://localhost:8000` for a local bench |

`.env` is git-ignored. Only `.env.example` is committed.

## Sign-in and sessions

Sign-in uses a Frappe **session cookie**, like the web panel. The login response carries a CSRF token, which the client sends on every POST.
In the phone app, CapacitorHttp keeps the cookie in the device's cookie store. Accounts that aren't linked to a store (platform staff) are turned away.

## Scripts

- `npm run dev` starts the dev server.
- `npm run build` runs the type check and builds a production bundle into `dist/`.
- `npm run typecheck` runs TypeScript only.
