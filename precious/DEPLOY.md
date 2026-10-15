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

## 2. Before going live: three things to fix (the build blocks until they're done)

1. **Replace all 35 sample photos.** They're other stylists' work, and some carry their watermarks. Publishing them is copyright infringement, which is the most likely way to get sued.
   - Use only photos Precious took of her own work.
   - Get every client in a photo to sign `legal/liberatoria-foto.md` **before** posting it. A parent signs for children.
   - Put the photos in `site/public/gallery/` as `.webp`, about 800px wide, and set `"own": true` for each in `site/src/data/gallery.json`.
2. **Fill in the real links** in `site/src/config.ts`: Instagram, TikTok, and the Google review link (from the Google Business Profile, under "Ask for reviews").
3. **Opening hours.** Not legally required, but Google expects them. Send them over and I'll add them to the site and the structured data.

## 3. Domain

- Buy the domain **in Precious's name** (or the business's), e.g. `preciousbeauty.it`, from an Italian or EU registrar such as Register.it, Aruba or OVH. A `.it` domain needs an EU resident or business as the holder, which she is.
- Turn on two-factor login at the registrar.

## 4. Deploy on Vercel (about 15 minutes)

1. Create a **Vercel** account at vercel.com with her email, and turn on two-factor login.
2. **Add New → Project**, then import the GitHub repository `joshuk809-hue/josh02`.
3. Settings:
   - **Root Directory:** `precious/site`
   - Framework: Vite (detected automatically). The build command (`npm run release`) and output folder (`dist`) come from `vercel.json`.
4. Click **Deploy**. If the build stops with "Not ready to go live", do step 2 first.
5. **Settings → Domains**: add `preciousbeauty.it` and `www.preciousbeauty.it`, then copy the DNS records Vercel shows into the registrar. HTTPS certificates are automatic.
6. In Vercel, also:
   - **Deployment Protection**: keep it on for preview deployments.
   - **Do not** enable Vercel Web Analytics or Speed Insights. They would need a mention in the privacy notice, and the site doesn't need them.
   - The Vercel Data Processing Addendum covers Vercel's role in the privacy notice. It's part of their terms; download a copy and keep it with the business papers.
7. After it's live:
   - Open `https://<domain>/#card` and write that link onto the NFC chip of the business card (see `nfc-card/README.md`).
   - Check the headers at securityheaders.com; it should score **A**.
   - Test the structured data with Google's Rich Results Test (search for it); it should find a "HairSalon".

## 5. Google Business Profile (free, the biggest boost for local customers)

- Create or claim it at google.com/business with **exactly** these details: `Precious Beauty` · `Via Paleocapa 8/B, 24122 Bergamo BG` · `+39 371 578 0893`, category "Parrucchiere" (add "Treccine africane"), the website domain, and opening hours.
- Then copy the "Ask for reviews" link into `config.ts` and redeploy.
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

- **New photos or prices:** edit the files, commit, and Vercel redeploys automatically. Keep signed consent forms for every new photo.
- **New tracking tools:** if you ever add analytics, ads or embedded videos, update `#privacy` **and** add a cookie consent banner before going live.
- **Privacy notice changes:** change the date in `site/src/sections/Privacy.tsx` whenever the notice changes.
