# Growth Suite demo (white-label)

A clickable demo of the agency's AI growth package that you can show to prospects. It is one self-contained file, `index.html`. Open it in any browser. There is no build step and no server.

## What's inside

| Tab | Shows | Package module |
|-----|-------|----------------|
| Overview | KPIs, a customer database growth chart, live activity feed | Reporting |
| Website | The client's mobile website with a working booking form that feeds the CRM | A · Website & booking |
| AI Receptionist | WhatsApp / Instagram / web chat that answers FAQs and takes bookings | B · AI front desk |
| CRM | Searchable customer list with auto-segments (New, Regular, VIP, At risk), profiles, notes, CSV copy | C · CRM |
| Reviews | Rating breakdown, review requests, AI-drafted replies to approve | D · Google reviews |
| Automations | Review requests, missed-call text-back, reminders, win-back, welcome, birthday, reorder: toggle or run now | E · Automations |
| Inventory | Stock in and out with staff and notes, low-stock alerts, draft purchase orders, movement log | H · Inventory app |
| Packages | Proposal builder: pick a tier and add-ons, get setup, monthly and break-even figures, copy the proposal text | Sales |
| Brand settings | Rebrand live (name, domain, colour) before a meeting, reset the data | White-label |

Four ready-made demo businesses: **restaurant, hair & beauty salon, retail shop, social media agency**. Switch between them with the selector at the top right.

## Adapting it for a client

Everything a client sees comes from the `CONFIG` block at the top of the `<script>` in `index.html`:

- `agency`: your agency name ("Powered by …").
- `currency`: the currency symbol.
- `packages` and `addons`: your price list.
- `presets`: one entry per business. To add a client, copy an existing preset (for example `salon`), give it a new key, and change:
  - `name`, `accent` (brand colour), `domain`, `headline`, `sub`, `cta`
  - `customerWord` (guests / clients / customers) and `bookingWord` (reservation / appointment / …)
  - `avgTicket`: average spend per visit, used for revenue and break-even figures
  - `services`: `[name, price]` shown on the website
  - `faqs`: keywords and the answer the AI receptionist gives
  - `movement`: labels for stock in, stock out and waste
  - `inventory`: `[SKU, name, unit, quantity, minimum, unit cost, supplier]`
  - `reviews`: `[stars, name, text]`

Shared automations are in the `AUTOMATIONS` list just below `CONFIG`.

For a quick rebrand without editing code, use the **Brand settings** tab.

## Notes

- All customers, reviews and numbers are **sample data**. Nothing is sent anywhere. Messages, review requests and purchase orders are simulated.
- Changes are saved in the browser's `localStorage`, separately for each demo business. **Brand settings → Reset demo data** restores the samples. If you change the `CONFIG` sample data, reset so the new data loads.
- The AI receptionist here uses keyword matching on `faqs`, so the demo works offline. In a client build, connect it to a language model and the client's real booking system.
