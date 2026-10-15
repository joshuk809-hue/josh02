# Going live: Precious Beauty website

A checklist to put the site online the legal way in Italy and the EU. It's based on GDPR, the Italian Privacy Code, the Garante's cookie guidelines, art. 35 DPR 633/72, the Codice del Consumo and copyright law (L. 633/1941). **It's not legal advice.** Show the privacy notice (`#privacy`) and the photo consent form to her commercialista or a lawyer once before launch; that's the cheapest protection.

---

## 1. Already done in the code

| Area | What's in place |
|---|---|
| Business identity | Legal name, address, P.IVA and phone in the footer of every page (art. 35 DPR 633/72) |
| Privacy notice | `#privacy` in Italian and English: who is responsible, what's collected, hosting, WhatsApp, the visitor's rights, the Garante, the last-updated date |
| Cookies | None. Only the language choice is saved, which counts as technical, so **no cookie banner is needed** (Garante guidelines, 10 June 2021). Don't add Google Analytics, a Meta Pixel or embedded maps or videos without adding a consent banner first. |
| Google Fonts | Self-hosted, so no visitor IP addresses go to Google (the issue German courts fined sites for) |
| Prices | Shown as **final prices** (Codice del Consumo) |
| WhatsApp follow-ups | Only to clients who agreed, a "STOP" opt-out on every reminder, at most one message every 14 days |
| Security headers | `vercel.json`: HTTPS enforced (HSTS), a strict content security policy, no framing (blocks clickjacking), no MIME sniffing, a privacy-friendly referrer policy, and camera access only for the stock scanner |
| Launch guard | `npm run release` **refuses to build** while the site still has other stylists' photos or placeholder links |

## 2. Before going live

Nothing blocks the launch any more. The site only ever shows photos marked `"own": true`, so until her photos arrive the style cards show the logo.

1. **Her photos (after launch).** Use only photos of her own work, never other stylists' (copyright). Every client in a photo signs `legal/liberatoria-foto.md` **before** it goes up; a parent signs for children. Put them in `site/public/gallery/` as `.webp`, about 800px wide, and list each in `site/src/data/gallery.json` with `"own": true`. The old samples are in `precious/reference-photos/` for inspiration only.
2. **Links** (set in `site/src/config.ts`): Instagram and TikTok point to her videos. The Google review button opens her Maps listing until the real review link exists (step 5).
3. **Opening hours.** Not legally required, but Google expects them.

## 3. Domain: `preciousbeauty.it` (available on 15/10/2026)

- Register it **in Precious's name** (or the business's, with her P.IVA so she gets an invoice) at **Aruba**: €3.99 + VAT the first year, €11.99 + VAT a year after. A `.it` domain needs an EU resident or business as holder, which she is.
- Turn on two-factor login at the registrar. Don't buy Aruba's hosting or email add-ons; they aren't needed.

## 4. Hosting: Cloudflare Pages (€0)

Vercel's free plan is for non-commercial use only and Pro costs $20 a month, so both live projects run on Cloudflare Pages (free; its terms don't restrict business use). The studio sits behind Cloudflare Access (free up to 50 users). The Vercel project `precious-beauty` was only a test: pause or delete it once Cloudflare is live.

1. Create a free Cloudflare account and turn on two-factor login.
2. **Workers & Pages → Create → Pages → Connect to Git** → `joshuk809-hue/josh02`. Make two projects from the same repo, both with production branch `claude/qr-fidelity-crm-tracker-qyy6hp`, root directory `precious/site` and output `dist`:

   | Project | Build command | Who can open it |
   | --- | --- | --- |
   | `precious-beauty` | `npm run release` | Everyone (on the domain) |
   | `pb-studio-<random>` | `npm run build:studio` | Precious and you, via Access |

3. Website project → **Custom domains** → add `preciousbeauty.it` and `www.preciousbeauty.it`, then set the DNS records Cloudflare shows at Aruba. HTTPS is automatic.
4. Studio → **Zero Trust → Access → Applications → Add → Self-hosted**: domains `pb-studio-<random>.pages.dev` and `*.pb-studio-<random>.pages.dev`. Policy **Allow → Emails**: Precious's email and yours. Login method: **One-time PIN**. Then, in the Pages project, **Settings → Access policy**: enable it for previews too.
5. **Maintenance copy:** push to the `staging` branch. Each project builds a preview at `staging.<project>.pages.dev`. Test with example data; her real studio data stays on her phone.
6. Security headers come from `public/_headers` (same rules as `vercel.json`). Don't turn on Cloudflare Web Analytics; it would need a mention in the privacy notice. Cloudflare's Data Processing Addendum is part of its terms: download a copy and keep it with the business papers.
7. After it's live:
   - Open `https://preciousbeauty.it/#card` and write that link onto the NFC chip of the business card (see `nfc-card/README.md`).
   - Check the headers at securityheaders.com; it should score **A**.
   - Test the structured data with Google's Rich Results Test (search for it); it should find a "HairSalon".

## 5. Google Business Profile (free, the biggest boost for local customers)

- Create or claim it at google.com/business with **exactly** these details: `Precious Beauty` · `Via Paleocapa 8/B, 24122 Bergamo BG` · `+39 371 578 0893`, category "Parrucchiere" (add "Treccine africane"), the website domain, and opening hours.
- Then copy the "Ask for reviews" link (`https://g.page/r/...`) into `reviewUrl` in `config.ts` and push; the site and the studio's thank-you messages pick it up.
- **Never** buy reviews or write fake ones. It's illegal under the Codice del Consumo, and since 2023 the AGCM can fine for it.

## 6. Her own obligations as data controller (simple, but required)

GDPR applies to her client data even though it's stored on her own phone.

- **Phone security:** a screen lock (PIN or Face ID) and an up-to-date system. Client names, phone numbers and notes are on it.
- **Backups:** studio backups (`.json`) contain client data. Keep them in a private place, such as her own Google Drive or iCloud, never in a WhatsApp group or on a shared PC.
- **Consent:** tick "OK to send WhatsApp follow-ups" only if the client agreed, and untick it straight away if they reply STOP.
- **Notes:** don't write health details in client notes (e.g. medical conditions). If an allergy matters, write only what's needed ("allergy: latex") and only with the client's agreement.
- **Deletion requests:** delete the client in Clients and in WhatsApp within 30 days, and reply to confirm.
- **In the salon:** put a printed copy of the privacy notice (from `#privacy`) at the counter.
- **Data breach:** if the phone is lost or stolen, change her passwords, remotely wipe the phone, and if client data may be exposed, notify the Garante within 72 hours (garanteprivacy.it, "Data breach").
- **Accessibility:** the European Accessibility Act exempts micro-businesses (under 10 staff and €2M turnover), so no accessibility statement is needed. The site still meets the basics: readable contrast, alt text and keyboard focus.

## 7. Updating later

- **New photos or prices:** edit the files, commit, and Cloudflare redeploys automatically. Keep signed consent forms for every new photo.
- **New tracking tools:** if you ever add analytics, ads or embedded videos, update `#privacy` **and** add a cookie consent banner before going live.
- **Privacy notice changes:** change the date in `site/src/sections/Privacy.tsx` whenever the notice changes.
