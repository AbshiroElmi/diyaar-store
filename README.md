# Diyaar Store (Portal)

The web app for **store owners** on Diyaar. Owners use it to accept orders, manage their menu, follow sales and get paid.
It sits next to the customer app, the driver app and the admin panel, and uses the same backend (`diyaar_backend`).

## Quick start

```bash
npm install
cp .env.example .env     # mock mode is the default
npm run dev              # http://localhost:8090
```

In mock mode you can sign in with **any phone number** and the code **`123456`**.

## Mobile app (iOS & Android)

Portal ships as a native app called **Diyaar Store** (`so.diyaar.store`), built with Capacitor 8 like the customer and driver apps.

```bash
npm run ios        # build → sync → open Xcode (then ▶ Run on a simulator or iPhone)
npm run android    # build → sync → open Android Studio
npm run cap:sync   # after any web change, copy it into both native projects
npm run assets     # regenerate icons & splash from assets/*.png
```

**Phones get a separate, native-style interface** (`src/mobile/`), built with [Konsta UI](https://konstaui.com):
- **iPhone:** iOS styling — large titles, grouped lists, action sheets, swipe-style page transitions, SF font.
- **Android:** Material 3 styling — top app bar, Material switches, navigation bar, Roboto font.
- **Website on a computer or tablet:** keeps the sidebar layout (`src/pages/`).

Both interfaces use the same hooks and API layer, so a change to the data appears in both.
To preview the Android look in a browser, open `http://localhost:8090/login?theme=material` at phone width.

The app is set up to feel native:
- **Safe areas:** the top bar sits below the notch or Dynamic Island, and the tab bar sits above the home indicator.
- **Haptics:** tapping a tab, accepting an order, a new order arriving, and errors all give a short vibration.
- **Status bar:** its text color follows light or dark mode.
- **Splash screen:** stays up until the session is restored.
- **Android back button:** closes an open sheet first, then goes back a page, and leaves the app from Home.
- **Bottom sheets:** forms, order details and the **Menu** open as sheets that slide up from the bottom.

Icon and splash sources are in `assets/` (lime `#BEFF00` with the Diyaar hand, and dark `#2B330F` for dark mode).
**For live mode in the app**, set `VITE_API_BASE_URL` to the full backend URL. The app has no same-origin proxy.

## Pages

| Section  | Page          | What the owner does there |
|----------|---------------|---------------------------|
| Overview | Dashboard     | Live order counts, today's sales, 7-day trend, best sellers, latest reviews |
|          | Orders        | Accept / reject → prepare → ready, history with search, order details and timeline |
| Menu     | Products      | Add and edit items, sold-out switch, sale price, review status |
|          | Categories    | Create, rename, reorder and hide categories |
| Business | Earnings      | Balance, withdraw, transactions (CSV export), payout history |
|          | Reports       | Sales, net earnings, cancel rate, prep time, busy hours, payment mix |
|          | Reviews       | Rating summary, filters, quick replies |
|          | Promotions    | % off, $ off, free delivery, buy 1 get 1, promo codes |
| Store    | Store Profile | Name, contact, delivery fee, minimum order, delivery time |
|          | Opening Hours | Weekly schedule and holiday closures |
|          | Team          | Invite managers and staff, change roles |
| Account  | Notifications | Orders, reviews, payouts, product approvals |
|          | Support       | Tickets with chat-style replies, call and WhatsApp |
|          | Settings      | Auto-accept, order sound, alerts, theme, language |

**Navigation**
- **Desktop:** a sidebar with every page, plus a top bar with the store switch (Open / Busy / Closed), notifications and the account menu.
- **Phone:** a 5-item bottom bar: **Menu** · Home · Orders · Products · Earnings. **Menu** opens a bottom sheet with all pages.
- **New orders:** a chime plays, a toast appears, and badges update every 15 seconds. The browser tab title shows the number of new orders.

## Project structure

```
src/
  api/
    endpoints.ts      ← every backend endpoint name, marked ready / planned
    client.ts         ← one client; picks mock or live from .env
    types.ts          ← data shapes (same field names as the backend)
    services/         ← one file per area (orders, catalog, money, …)
    mock/
      seed.ts         ← demo store data
      handlers.ts     ← mock API, one handler per endpoint
  hooks/queries.ts    ← React Query hooks used by pages
  layouts/            ← sidebar, top bar, mobile bottom bar and Menu sheet
  pages/              ← desktop / tablet pages
  mobile/             ← phone app: MobileApp (tabs, Menu sheet, transitions), ui kit, screens/
  components/
    shared/           ← PageHeader, StatCard, StatusBadge, dialogs, states
    ui/               ← shadcn components (copied from the admin panel)
  lib/                ← env, navigation, formatting
```

Pages call **hooks**, hooks call **services**, and services call **`api`**. The pages never know whether the data is mocked.

## Environment (.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_MODE` | `mock` | `mock` = built-in demo API, `live` = Frappe backend |
| `VITE_API_BASE_URL` | *(empty)* | Backend URL in live mode. Empty = same origin |
| `VITE_API_METHOD_PATH` | `/api/method/diyaar_backend.api.stores.self_service` | Frappe module for store endpoints |
| `VITE_API_TIMEOUT_MS` | `20000` | Request timeout |
| `VITE_MOCK_LATENCY_MS` | `350` | Fake delay in mock mode |
| `VITE_DEFAULT_CURRENCY` / `VITE_DEFAULT_LOCALE` | `USD` / `en-US` | Money and number formatting |
| `PORTAL_DEV_PORT` | `8090` | Dev server port |
| `PORTAL_DEV_PROXY_TARGET` | *(empty)* | e.g. `http://localhost:8000`, which forwards `/api` to your bench |

`.env` is git-ignored. Only `.env.example` is committed.

## Switching to the real backend

1. Set `VITE_API_MODE=live` and `PORTAL_DEV_PROXY_TARGET=http://localhost:8000` in `.env`.
2. Endpoints marked **`ready`** in `src/api/endpoints.ts` already exist in
   `diyaar_backend/api/stores/self_service.py`: login and OTP, profile, open/close, orders, order status, products, analytics.
3. Endpoints marked **`planned`** need to be added to the backend. They are categories, dashboard, reports, reviews, earnings, promotions, team, notifications, support, hours and settings.
   Their request and response shapes are defined by the mock handlers in `src/api/mock/handlers.ts` and the types in `src/api/types.ts`, so the mock acts as the spec.

Sign-in uses the backend's `store_login` → `store_verify_otp` flow. The returned `api_key:api_secret` is sent as `Authorization: token …`.

## Scripts

- `npm run dev` starts the dev server.
- `npm run build` runs the type check and builds a production bundle into `dist/`.
- `npm run typecheck` runs TypeScript only.

In mock mode, **Settings → Reset demo data** restores the sample store.
