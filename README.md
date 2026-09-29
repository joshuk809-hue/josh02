# Hamburgheria del Contadino — Fidelity card & CRM (mock)

A working, self-contained mock of a contactless loyalty card with a customer tracker for a local burger restaurant.
Each card is linked to the restaurant's fidelity page by its card number:

```
https://lhamburgerdelcontadino.plateform.app/frontpage/fidelity?card=LHC-10421
```

Open `index.html` in a browser. No build step and no server needed. The QR libraries are bundled in `vendor/`.

## Views

| View | What it does |
|------|--------------|
| **Customer card** | Wallet-style card with a scannable QR, points balance, tier, unlocked rewards, tier progress and recent receipts. |
| **Till** | Staff identify the customer (camera scan, QR photo upload, or card number / phone / name), build the ticket from the menu, redeem rewards and record the sale. |
| **CRM** | KPIs (30-day revenue, change vs the previous 30 days, visits, active cards, items sold, points outstanding), a sortable and searchable customer table with segments, and a per-customer profile. |

For each customer, the CRM profile shows:
- total spent, visits, visit rhythm, average ticket, items bought per visit, points earned and used, lunch/dinner split
- spending for each of the last 6 months (bar chart)
- **best items** ranked by quantity, with revenue, share and free (reward) units
- spending by category (Burger / Side / Drink / Dessert)
- full receipt history, with line items and the points earned or redeemed on each receipt
- CSV export of all customers, or of one customer's line-item history

## Programme rules (edit in `app.js`)

- **Points:** 1 point per €1 paid, multiplied by the tier bonus. Fractions are rounded down.
- **Tiers** (based on lifetime spend, the same as the wallet cards): Germoglio €0 (×1) → Raccolto €250 (×1.25) → Riserva €600 (×1.5).
- **Rewards:** free rustic fries 80 pt · free tiramisù 120 pt · free Il Contadino burger 200 pt.
- **Segments:** *At risk* = no visit for 45+ days · *New* = member for 30 days or less · *VIP* = €400+ spent or 4+ visits a month · otherwise *Regular*.

All amounts are stored as integer cents, so totals are exact. Each receipt also stores the tier and points that applied when it was recorded.

## Notes

- The menu, prices and customers are **sample data**, generated the same way every time. The restaurant's page could not be reached while this was built.
- Data is saved in the browser's `localStorage`. **Reset demo data** restores the sample set.
- Camera scanning needs HTTPS or `localhost` (for example `python3 -m http.server`). Photo upload and manual lookup work everywhere.
- Deep links: `?card=LHC-10421` or `#LHC-10421` opens that card; `#till` and `#crm` open those views.

Third-party code: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) and [jsQR](https://github.com/cozmo/jsQR) (Apache-2.0, license in `vendor/`).

## Official fidelity QR — Hamburgheria del Contadino

The ready-to-print files are in `qr/`. They link to the fidelity section at
`https://lhamburgerdelcontadino.plateform.app/frontpage/fidelity`.

| File | Use it for |
|------|------------|
| `qr/fidelity-qr.svg` | Vector QR code. Send this one to print shops; it scales to any size. |
| `qr/fidelity-qr.png` | 2014 × 2014 px at 300 dpi (about 17 cm). For social posts, menus and digital use. |
| `qr/fidelity-poster.pdf` | A5 counter or table card in Italian, ready to print. |
| `qr/fidelity-poster.png` | Preview of the card. |

The QR uses error-correction level H, so it still scans with up to about 30% of it damaged or stained. The generator checks that each output decodes back to the exact URL.
To rebuild the files (for example after a change of URL or name), edit `TARGET_URL` or `RESTAURANT` in `tools/make-fidelity-qr.js` and run:

```
node tools/make-fidelity-qr.js
```

Print the QR at least 2 × 2 cm, and keep the white border around it.

## Apple Wallet & Google Wallet cards

There are three card designs, one for each type of customer. The names follow the life of a field, in keeping with *Contadino* (farmer):

| Card | Customers | From | Points per €1 | Look |
|------|-----------|------|---------------|------|
| **Germoglio** (the sprout) | New | first visit | 1 | Bottle green and cream, with fine-line sprouts over ploughed furrows |
| **Raccolto** (the harvest) | Regular | €250 spent | 1.25 | Roasted chestnut, with a sheaf of wheat engraved in wheat-gold |
| **Riserva** (the reserve) | VIP | €600 spent | 1.5 | Black, with a gold-foil border, a guilloché rosette and a gold crest |

The cards are **contactless**: no QR code or barcode. At the till the customer holds their phone to the reader, as if paying, and the reader receives the card number over NFC.

Open `wallet/index.html` for the animated showcase:
- **Floating cards:** glossy, high-resolution cards that float over a black ground and tilt towards your pointer, with a specular highlight, a clear-coat sheen, a periodic light sweep and a moving floor shadow.
- **Riserva:** its gold foil lettering shimmers.
- **Wallet previews:** each pass in Apple Wallet and Google Wallet, with a "Prova il tap" button that plays a contactless tap and counts the points up.

Motion is switched off for anyone who has "reduce motion" turned on. The customer card in the app uses the same design, with a pulsing contactless zone where the QR code used to be.
The HD card faces are `wallet/art/<tier>/card@3x.jpg` (3033 × 1914 px).
The perks listed for each tier in `wallet/tiers.js` are **suggestions**. Edit them before launch.

**Build:** `node tools/build-wallet-passes.js` renders the artwork into `wallet/art/` and builds the three sample cards.
To build a card for one customer:

```
node tools/build-wallet-passes.js --card LHC-10458 --name "Marco Bianchi" --spend 1290.00 --points 312 --since 2026-03-29
```

**Contactless setup:**
- **Apple Wallet:** Apple has to enable NFC for the Pass Type ID. Once it does, set `APPLE_NFC_PUBLIC_KEY` (a base64 P-256 public key) and each pass gets an `nfc` payload carrying the card number.
- **Google Wallet:** once Smart Tap is enabled for your issuer, set `GOOGLE_SMART_TAP=1`. The classes then get `enableSmartTap`, and every object already carries `smartTapRedemptionValue`.
- **The till** needs a reader that supports Apple VAS or Google Smart Tap. Many current payment terminals do.

**Apple Wallet:** the script always writes the pass bundle to `wallet/build/apple/<card>.pass/` (`pass.json`, images and `manifest.json`).
An iPhone only accepts a pass that is signed with the restaurant's own certificate. To get one:
1. In an Apple Developer account, create a Pass Type ID.
2. Download its certificate, then export the certificate and private key as PEM files.
3. Download Apple's WWDR G4 certificate.
4. Set these variables and run the build again. It signs the pass with `openssl` and writes `wallet/build/apple/<card>.pkpass`:

```
APPLE_PASS_TYPE_ID=pass.it.hamburgheriadelcontadino.fidelity APPLE_TEAM_ID=ABCDE12345 \
APPLE_CERT_PEM=cert.pem APPLE_KEY_PEM=key.pem APPLE_WWDR_PEM=AppleWWDRCAG4.pem \
node tools/build-wallet-passes.js --card ... --name ...
```

**Google Wallet:** the script always writes the tier classes to `wallet/build/google/classes/` and the customer objects to `wallet/build/google/objects/`.
To get "Add to Google Wallet" links:
1. Get an Issuer ID in the Google Pay & Wallet Console.
2. Create a service account with Wallet access and download its JSON key.
3. Put `wallet/art/` online at a public HTTPS address.
4. Set these variables and run the build. The links are written to `wallet/build/google/save-links.txt`:

```
GOOGLE_ISSUER_ID=3388000000012345678 GOOGLE_SA_KEY=service-account.json \
GOOGLE_IMAGE_BASE_URL=https://your-host/wallet/art node tools/build-wallet-passes.js
```

Both signing paths were tested with throwaway keys:
- The `.pkpass` signature verifies over the manifest, and every file hash matches.
- The Google JWT verifies with RS256.

Keys, certificates, signed `.pkpass` files and save links are listed in `.gitignore` so they never get committed.

The fonts for the artwork are Cinzel and Cormorant Garamond, both under the SIL Open Font License (licence files in `wallet/design/fonts/`).
