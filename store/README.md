# 🫰 Diyaar Store: Store Kit

Everything you need to publish **Diyaar Store** on the **App Store** and **Google Play**: screenshots, icons, the feature graphic, listing text, the exact sizes each store wants, and a checklist so nothing bounces in review.

```
store/
├── README.md                ← you are here: sizes, gotchas, upload steps
├── STORE_LISTING.md         ← all the copy-paste text (name, descriptions, keywords, privacy answers…)
├── delete-account/          ← public "delete your account" page (Google Play needs its URL)
│   ├── index.html                standalone page, host it anywhere
│   └── frappe-web-page.html      same page, paste into a Frappe "Web Page" (styles scoped)
├── screenshots/
│   ├── ios/
│   │   ├── iPhone 6.9in_1320x2868/                                 ✅ main iPhone set (6.9" display)
│   │   ├── iPhone with Dynamic Island (medium display)_1206x2622/  ✅ if App Store Connect shows this tab
│   │   ├── iPhone 6.5in_1284x2778/                                 optional (6.5" display)
│   │   ├── iPad 13in display_2064x2752/                            ✅ needed while iPad is enabled
│   │   └── iPhone Duo_2007x2853/                                   ✅ if App Store Connect shows this tab
│   └── android/
│       ├── phone_1080x1920/            ✅ required
│       ├── tablet-7in_1080x1920/       recommended
│       └── tablet-10in_1440x2560/      recommended
├── graphics/
│   ├── ios/app-store-icon_1024x1024.png                     (no alpha ✓)
│   ├── ios/Header_3840x1646.png  ios/Header_5244x2950.png   (product page header, pick one)
│   ├── ios/Search-Results_3840x2560.png                     (search results artwork)
│   └── android/
│       ├── play-icon_512x512.png                ✅ required
│       └── feature-graphic_1024x500.png         ✅ required
└── source/                  ← HTML templates that generate all of the above
    ├── shot.html  graphic.html  screens.js  styles.css
    ├── fonts/ (Fredoka, Nunito, both OFL)  assets/ (logo hand, app icon)
    └── render.sh
```

Each screenshot folder has the same 7 shots, in this order:

| 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|
| 🏪 Your store (Home) | 🛎️ Accept orders | 🧑‍🍳 Kitchen to door | 📋 Menu | 💸 Earnings | ⭐ Reviews | ⏰ Hours & team |

---

## 📐 Size cheat-sheet

### 🍏 App Store Connect

| Asset | Size (px) | Format | Count | File |
|---|---|---|---|---|
| App icon | 1024 × 1024 | PNG, **no transparency**, square (Apple rounds it) | 1 (in the Xcode asset catalog) | `graphics/ios/app-store-icon_1024x1024.png` |
| iPhone 6.9" display | **1320 × 2868** (also accepted: 1290 × 2796) | PNG/JPG, RGB, no alpha | 1–10 | ✅ `iPhone 6.9in_1320x2868/` |
| iPhone with Dynamic Island (medium display) | **1206 × 2622** (also accepted: 1179 × 2556) | PNG/JPG, no alpha | 1–10 | ✅ `iPhone with Dynamic Island (medium display)_1206x2622/` |
| iPhone 6.5" display | 1284 × 2778 | PNG/JPG | 1–10 | optional · `iPhone 6.5in_1284x2778/` |
| iPhone Duo | **2007 × 2853** | PNG/JPG, no alpha | 1–10 | ✅ `iPhone Duo_2007x2853/` |
| iPad 13" display | **2064 × 2752** (or 2048 × 2732) | PNG/JPG | 1–10 | ✅ `iPad 13in display_2064x2752/` (needed because `TARGETED_DEVICE_FAMILY = 1,2`) |
| Header (product page) | 3840 × 1646 or 5244 × 2950 | PNG, no alpha | 0–1 | `graphics/ios/Header_3840x1646.png` (or `Header_5244x2950.png`). No text: the store puts the app name over it |
| Search Results | 3840 × 2560 | PNG, no alpha | 0–1 | `graphics/ios/Search-Results_3840x2560.png` |
| App preview video | 886 × 1920, 15–30 s | .mov/.mp4 | 0–3 | optional, not made |

> App Store Connect only asks for the sizes it shows tabs for; smaller iPhones and iPads are **auto-scaled** from the largest set you upload. Upload the sets whose tabs you see, and keep the 01→07 order.

### 🤖 Google Play Console

| Asset | Size (px) | Format | Count | File |
|---|---|---|---|---|
| App icon | **512 × 512** | 32-bit PNG, ≤ 1 MB, full square (Google adds the mask) | 1 | ✅ `graphics/android/play-icon_512x512.png` |
| Feature graphic | **1024 × 500** | JPG or 24-bit PNG, **no alpha** | 1 | ✅ `graphics/android/feature-graphic_1024x500.png` |
| Phone screenshots | 9:16, each side 320–3840 · **≥ 1080 px for promo eligibility** | PNG/JPG ≤ 8 MB | 2–8 (use **4+**) | ✅ `phone_1080x1920/` (7 shots) |
| 7" tablet screenshots | 9:16, each side 320–3840 | PNG/JPG | up to 8 | ✅ `tablet-7in_1080x1920/` |
| 10" tablet screenshots | 9:16, each side 1080–7680 | PNG/JPG | up to 8 | ✅ `tablet-10in_1440x2560/` |
| Promo video | YouTube URL | | 0–1 | optional |

Everything here was checked after rendering: exact pixel sizes ✓, **no alpha channel** in any of the 62 PNGs ✓, every file well under 8 MB ✓.

---

## 🚨 Gotchas found in this repo (fix these before you submit)

| | Issue | Why it matters | Fix |
|---|---|---|---|
| 🔴 | **No way to delete an account in the app.** [Settings.tsx](../src/mobile/screens/Settings.tsx) only has Sign out, and owners can create staff accounts in the app ([Team.tsx](../src/mobile/screens/Team.tsx)). | Apple **5.1.1(v)**: apps that let people create accounts must let them delete them in the app. Google Play asks for a deletion link in Data safety. | Add **Settings → Delete account** (confirm dialog → backend endpoint, or at least open the deletion page). Host [`delete-account/index.html`](delete-account/index.html) and use its URL in Play. |
| 🔴 | **Owner login is phone + SMS code.** | Reviewers can't receive Somali SMS, so the app gets rejected as "can't sign in". | Use the existing **"Sign in with email instead"** path: create a demo owner/admin account with email + password on a demo store with data (see `STORE_LISTING.md → App Review`). |
| 🟠 | **No privacy policy link inside the app.** | Apple 5.1.1(i) wants the policy reachable in the app as well as on the listing. | Add a "Privacy policy" row in Settings (and on the login screen) that opens https://diyaar.so/privacy. |
| 🟠 | **iPhone allows landscape** (`UISupportedInterfaceOrientations` in `ios/App/App/Info.plist` lists LandscapeLeft/Right) and Android has no `screenOrientation`. | The UI is built for portrait; a reviewer who rotates the phone sees a stretched layout. | Keep only `UIInterfaceOrientationPortrait` for iPhone, and add `android:screenOrientation="portrait"` to the activity in `AndroidManifest.xml`. |
| 🟠 | **iPad is enabled** (`TARGETED_DEVICE_FAMILY = "1,2"`). | Apple reviews on iPad too, and the UI must look right there. | Test on an iPad simulator (iPad screenshots are ready), or set it to `1` (iPhone-only; the iPad set is then not needed). |
| 🟡 | `ITSAppUsesNonExemptEncryption` missing from `Info.plist`. | You'll get the export-compliance question on every build. | Add `<key>ITSAppUsesNonExemptEncryption</key><false/>` (the app only uses HTTPS). |
| 🟡 | `UIBackgroundModes → remote-notification` is set, but no push plugin is installed. | Harmless today, but reviewers may ask what it's for. | Remove it until push notifications are added. |
| 🟡 | Versions don't match: iOS **1.0.2 (1)**, Android **1.0 (1)** in `android/app/build.gradle`. | Confusing for support; Play rejects re-used `versionCode`s. | Align `versionName` with iOS and bump `versionCode` on **every** upload. |

---

## 🍏 Uploading to the App Store: step by step

1. **Prep the build**
   - Fix the 🔴 items above.
   - `npm run ios` (builds the web app, syncs, opens Xcode).
   - In Xcode: bump **Version** (`MARKETING_VERSION`) and **Build** (`CURRENT_PROJECT_VERSION`), select *Any iOS Device (arm64)* → **Product › Archive** → **Distribute App › App Store Connect › Upload**.
2. **App Store Connect → Apps → ➕ New App** (first time only)
   - Platform iOS · Name **Diyaar Store** · Language English (U.S.) · Bundle ID `so.diyaar.store` · SKU e.g. `diyaar-store-ios`.
3. **App Information**: subtitle, categories (Business / Food & Drink), privacy policy URL, age rating questionnaire, content rights. Everything is in `STORE_LISTING.md`.
4. **App Privacy**: answer using the table in `STORE_LISTING.md`.
5. **Version page (1.0 Prepare for Submission)**
   - **App Previews and Screenshots**: for each device tab shown, drag in the matching folder from `screenshots/ios/` (keep the 01→07 order). Start with *6.9" Display* → `iPhone 6.9in_1320x2868/*`.
   - *iPad 13" Display* → `screenshots/ios/iPad 13in display_2064x2752/*` (unless you went iPhone-only).
   - Promotional text, description, keywords, support & marketing URLs, What's New.
   - **Build**: pick the uploaded build (appears ~10–30 min after upload) and answer export compliance (No).
   - **App Review Information**: demo email + password, notes and contact.
   - Version release: *Manually* or *Automatically* after approval.
6. **Add for Review → Submit**. Typical review: 24–48 h.

## 🤖 Uploading to Google Play: step by step

1. **Prep the build**
   - Bump `versionCode` / `versionName` in `android/app/build.gradle`.
   - `npm run android` (builds, syncs, opens Android Studio).
   - **Build › Generate Signed App Bundle (.aab)** with your upload key (keep the keystore + passwords somewhere safe; losing them means contacting Google support).
2. **Play Console → Create app**: name **Diyaar Store**, App, Free, accept declarations.
3. **Dashboard › Set up your app** (each must be ✅):
   - App access → demo email + password ("Tap *Sign in with email instead*")
   - Ads → **No**
   - Content rating → IARC questionnaire (answers in `STORE_LISTING.md`)
   - Target audience → **18+**
   - Data safety → answers in `STORE_LISTING.md`, plus the delete-account URL
   - Government app → No · Financial features → None · Health → No
   - Privacy policy URL
4. **Grow › Store presence › Main store listing**
   - Short + full description
   - App icon → `graphics/android/play-icon_512x512.png`
   - Feature graphic → `graphics/android/feature-graphic_1024x500.png`
   - Phone screenshots → `screenshots/android/phone_1080x1920/*`
   - 7" tablet → `screenshots/android/tablet-7in_1080x1920/*`
   - 10" tablet → `screenshots/android/tablet-10in_1440x2560/*`
5. **Store settings**: category **Business**, tags, contact email/website.
6. **Testing → Internal testing** first (instant, up to 100 testers) → then **Production › Create release** → upload `.aab` → release notes → **Review release → Start rollout**.

> ℹ️ **New personal developer accounts** (created after Nov 2023) must run a **closed test with 12+ testers for 14 days** before production is unlocked. Organization accounts skip this.

---

## 🎨 Regenerating the artwork

Everything is generated from HTML, so changing a caption or a number takes seconds. You need **Google Chrome** installed (macOS path is the default; set `CHROME=/path/to/chrome` elsewhere).

```bash
bash store/source/render.sh               # everything (~1 min)
bash store/source/render.sh ios-phone     # only iPhone sets
bash store/source/render.sh android/phone # only one folder
bash store/source/render.sh graphics      # icons, feature graphic, headers
```

Where to edit:

| Want to change… | Edit |
|---|---|
| Headlines, sub-lines, stickers, background theme | `source/shot.html` → `SHOTS` |
| What's on the phone screens (numbers, names, UI) | `source/screens.js` → `S.home`, `S.orders`, `S.detail`, `S.products`, `S.earnings`, `S.reviews`, `S.hours` |
| Colours, fonts, sticker style | `source/styles.css` (`--olive #2B330F`, `--lime #BEFF00`, `--teal #219186`) |
| Feature graphic / icons / headers | `source/graphic.html` |
| Add a new size | `TARGETS` list in `source/render.sh` |

Preview any shot live in Chrome:
`store/source/shot.html?kind=ios-phone&shot=3&w=1320&h=2868` (kind = `ios-phone | ios-duo | android-phone | ios-tablet | android-tablet`)

> 📝 The screens are faithful **mockups** of the real app (same layout, colours and features as `src/mobile/screens/`) with friendly demo data (Kulan Café in Hodan, Mogadishu). Both stores allow this, but the screenshots must reflect real features. If a screen changes a lot in the app, update its mockup too.

---

## ✅ Final pre-flight checklist

- [ ] Delete account works in the app (Settings) and the web deletion page is live
- [ ] Privacy policy link inside the app
- [ ] Demo store + email/password account works on a clean install, with menu, orders, reviews and earnings
- [ ] Portrait-only on iPhone and Android
- [ ] `ITSAppUsesNonExemptEncryption = NO` added
- [ ] Versions bumped (iOS build number, Android `versionCode`)
- [ ] Privacy policy + terms + support pages are live on diyaar.so
- [ ] Screenshots uploaded in order 01 → 07 on both stores
- [ ] Feature graphic + 512 icon uploaded on Play
- [ ] App Privacy (Apple) and Data safety (Google) filled and matching
- [ ] Tested on a real iPhone, an Android phone, and (if iPad is on) an iPad simulator

Good luck with the launch! 🚀💚
