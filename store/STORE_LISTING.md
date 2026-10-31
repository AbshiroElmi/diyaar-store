# 🫰 Diyaar Store: Store Listing

Copy-paste text for **App Store Connect** and **Google Play Console**.
Character counts are shown as `(used/limit)`. Fields marked **TODO** need a real value before you submit.

> 💚 **Voice:** friendly, short, upbeat. Talk to the store owner as "you". The app works for any kind of store (restaurants, cafés, groceries, pharmacies, shops), so keep the copy general and don't promise sales numbers.

---

## 🧾 Shared facts

| Field | Value |
|---|---|
| App name | **Diyaar Store** |
| Bundle ID / Package | `so.diyaar.store` |
| Developer / Seller | **TODO**: legal entity name (e.g. Diyaar / Yooltech) |
| Website | https://diyaar.so |
| Privacy policy | https://diyaar.so/privacy *(make sure the page is live and mentions store partners)* |
| Terms | https://diyaar.so/terms |
| Support URL | **TODO**: https://diyaar.so/support (needs a real page with contact details) |
| Support email | **TODO**: e.g. support@diyaar.so |
| App language | English |
| Audience | Store owners and staff who sell on Diyaar, **18+** |
| Price | Free · no ads · no in-app purchases |
| Who can sign in | Only stores that are already Diyaar partners. Accounts are created by Diyaar; owners can add staff from the app (Team). |

---

## 🍏 App Store (iOS)

### Name `(12/30)`
```
Diyaar Store
```

### Subtitle `(29/30)`
```
Orders, menu & sales, all set
```
*Alternative (27/30):* `Manage orders, menu & sales`

### Promotional text `(152/170)`
*Can be changed any time without a new build.*
```
New orders ring in, you tap Accept. Update prices, mark items sold out, follow today's sales and your payout, and open or close your store in one tap. 🫰
```

### Keywords `(97/100)`
*Comma-separated, no spaces. Don't repeat words from the name ("Diyaar", "Store"). Apple already indexes those.*
```
merchant,restaurant,orders,menu,seller,partner,shop,kitchen,sales,business,Somalia,Mogadishu,food
```

### Description `(≤4000)`
```
Diyaar Store is the app for Diyaar partner stores. Accept orders, keep your menu up to date, follow your sales and see what you've earned, all from your phone.

NEVER MISS AN ORDER
• New orders ring in with a sound and a vibration
• Accept in one tap, then move each order from Accepted to Cooking to Ready
• Live timers flag orders that have waited too long
• See the customer's notes, the items and the total at a glance

EVERY ORDER, START TO FINISH
• Full order details: items, special requests, payment and delivery address
• Call the customer right from the order
• See when a Diyaar driver is assigned and on the way
• Pickup orders too: mark them collected when the customer arrives
• Search your order history by order number, customer or phone

YOUR MENU, YOUR WAY
• Add items with photos, prices and descriptions
• Set discount prices and tags like Best seller, New or Spicy
• Mark items sold out or back in stock with one tap
• Track stock and set prices per store location
• Import or export your whole menu as a CSV file

WATCH YOUR SALES GROW
• Today's sales and orders compared with yesterday
• Your last 7 days at a glance
• Your payout balance, monthly earnings and commission
• All-time sales and earnings

YOUR STORE, YOUR RULES
• Open or close your store in one tap
• Set your weekly opening hours
• Turn on auto-accept for busy times
• Add staff and manage your team
• Read your customers' ratings and reviews
• See the Diyaar promotions and banners running for your store

Light and dark themes included.

Diyaar Store is for stores that sell on Diyaar. To become a partner, visit diyaar.so.
Questions? Visit diyaar.so or contact Diyaar support.
```

### What's New (release notes) `(≤4000)`
```
Welcome to Diyaar Store! 🫰
• Accept orders and move them from Cooking to Ready
• Update your menu, prices and stock on the go
• Follow today's sales, your payout and your reviews
• Set opening hours and manage your team
```

### Categories
| | |
|---|---|
| Primary | **Business** |
| Secondary | **Food & Drink** |

### Age rating
Fill in the questionnaire honestly. Notes:
- No violence, mature content, gambling, ads or web browsing → answer **None/No**.
- No chat or messaging between users → **No** to user-to-user communication.
- Customer reviews are shown read-only to the store. If the questionnaire asks about user-generated content, describe them as **customer reviews of the store, visible only to that store**.
- Expected result: **4+**. The app itself is for adults running a business (your partner terms should say so).

### App Privacy ("nutrition label")
*Verify each line with the backend team. Apple rejects labels that don't match what the app actually does.*

| Data type | Collected | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact info: name, phone number, email | ✅ | ✅ | ❌ | App functionality (account, sign-in, team) |
| User ID | ✅ | ✅ | ❌ | App functionality |
| Photos (product and store photos the user uploads) | ✅ | ✅ | ❌ | App functionality |
| Other user content (menu items, prices, opening hours) | ✅ | ✅ | ❌ | App functionality |
| Location | ❌ | | | The app doesn't ask for location |
| Financial info | ❌ | | | Payout accounts are shown read-only; they're managed on the web panel |
| Crash / performance data | only if you add a crash reporter | | ❌ | Analytics |

**Tracking:** No (no ad SDKs and no cross-app tracking).

> ℹ️ The app *shows* customer names, phone numbers and addresses on orders. That's data about other people received from Diyaar, not data collected from the app's user, so it doesn't go on this label. Make sure the privacy policy explains that stores see customer details only to fulfil orders.

### Export compliance
The app only uses HTTPS (standard encryption) → **No** to non-exempt encryption. Add `ITSAppUsesNonExemptEncryption = NO` to `Info.plist` so the question stops appearing (see README gotchas).

### App Review information
```
This app is for stores that are already Diyaar partners. Accounts are created by
Diyaar, so there is no sign-up screen.

Sign in: on the login screen tap "Sign in with email instead" (staff sign-in) and use:
Email:     TODO (e.g. review@diyaar.so)
Password:  TODO

The demo account belongs to a demo store with menu items, past orders, reviews and
earnings. To see a new order arrive: TODO (e.g. "place an order for 'Diyaar Demo Store'
in the Diyaar customer app" or "a test order is created every 10 minutes").

Camera / photo library: used only to add product photos to the menu.
Delete account: Settings → Delete account (TODO: add it, see README).
```
Contact: **TODO** name, phone and email of someone who answers during review.

> The owner sign-in uses a code sent by SMS to a Somali number, which reviewers can't receive. Use the **email + password** staff sign-in for the review account (make it an owner/admin so every screen is visible), or set a fixed OTP for one demo number.

---

## 🤖 Google Play (Android)

### App name `(12/30)`
```
Diyaar Store
```

### Short description `(73/80)`
```
Accept orders, update your menu & watch your sales grow, all in one app 🫰
```
*Plain alternative without emoji (78/80):*
```
Accept orders, update your menu and follow your sales: the Diyaar partner app.
```

### Full description `(≤4000)`
Use the **same text as the App Store description** above. Play allows the same plain-text format.

### Release notes (What's new) `(≤500)`
Same as the App Store "What's New" above.

### Category & tags
| | |
|---|---|
| App or game | App |
| Category | **Business** |
| Tags (pick up to 5) | Business tools · Restaurant management · Point of sale · Inventory · Food delivery |
| Contains ads | **No** |
| Email | **TODO**: support@diyaar.so |
| Phone | optional |
| Website | https://diyaar.so |
| Privacy policy | https://diyaar.so/privacy |

### Content rating (IARC questionnaire)
- Category: **Utility, Productivity, Communication, or Other**
- Violence / sexuality / language / drugs / gambling: **No**
- Users can interact or exchange info: **No** (no chat; staff accounts are inside one business)
- Shares user location with other users: **No**
- Digital purchases: **No**
- Expected result: Everyone / PEGI 3.

### Target audience
- Age groups: **18 and over** only
- Not designed for children

### Data safety form
| Data | Collected | Shared | Optional? | Why |
|---|---|---|---|---|
| Name, email, phone number, user ID | Yes | No | Required | Account management, App functionality |
| Photos (product photos) | Yes | No | Optional | App functionality |
| Other user-generated content (menu, prices, hours) | Yes | No | Required | App functionality |
| Location | No | | | |
| Financial info | No | | | Payout accounts are managed on the web panel |
| App interactions / crash logs | only if you add analytics | | | |

- Data encrypted in transit: **Yes** (HTTPS only)
- Account creation: **Username and password** and **phone number + SMS code**. Accounts are created by Diyaar; owners can add staff.
- Users can request deletion: **Yes**. Delete account URL: host [`delete-account/index.html`](delete-account/index.html) publicly (or paste [`delete-account/frappe-web-page.html`](delete-account/frappe-web-page.html) into a Frappe Web Page on the backend site) and paste its address. **TODO:** confirm the retention periods on that page match your real policy before publishing.
- Delete some data without deleting the account: **Yes** (owners can delete menu items and deactivate staff in the app)

> ℹ️ Menu items and product photos are shown to customers in the Diyaar customer app. That's the purpose of the service, run by the same company, so it normally isn't "sharing" in Google's definition. Double-check with whoever owns your privacy policy.

### App access (for reviewers)
Choose **"All or some functionality is restricted"** and add the **same demo email + password** as in App Review above, with the note *"Tap 'Sign in with email instead' on the login screen."*

### Permissions declarations
None needed. The Android app only requests `INTERNET`; photos are picked through the system file picker.

---

## 📸 Screenshot captions (same order on both stores)

| # | File | Headline | Sub-line | Screen shown |
|---|---|---|---|---|
| 1 | `01-your-store` | Your whole store **in your pocket** | Orders, menu, sales & earnings in one app | Home |
| 2 | `02-accept-orders` | Accept orders **in a snap** 🫰 | New orders ring in. Tap Accept and get cooking | Orders board |
| 3 | `03-kitchen-to-door` | From kitchen to **doorstep** | Track every order from cooking to delivered | Order details |
| 4 | `04-menu` | Update your menu **in seconds** | Add items, edit prices & mark sold out | Menu items |
| 5 | `05-earnings` | Watch your sales **grow** 💸 | See your payout and every dollar you earn | Earnings |
| 6 | `06-reviews` | See what customers **love** ⭐ | Every rating and review in one place | Reviews |
| 7 | `07-hours-team` | Your store, **your rules** | Set opening hours, add your team & close any time | Opening hours |

Edit captions in [`source/shot.html`](source/shot.html) (`SHOTS`) and re-run `bash store/source/render.sh`.

---

## 🌍 Localization (later)
The app is English-only today. If the app gets Somali (and Arabic) translations, add translated listings too (the name stays "Diyaar Store"): have a native speaker translate the subtitle, short description, description and screenshot captions, then add `?lang=` support to `shot.html` or copy it per language.
