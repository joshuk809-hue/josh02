# Hamburgheria del Contadino — Fidelity card & CRM (mock)

A working, self-contained mock of a QR loyalty card with a customer tracker for a local burger restaurant.
The QR on each card encodes the restaurant's fidelity link plus the card number:

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
- **Tiers** (based on lifetime spend): Seme €0 (×1) → Germoglio €250 (×1.25) → Raccolto €600 (×1.5).
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
