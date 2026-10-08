# Precious Beauty: website and studio tools

`site/` is one app with two parts:

- **The website** (`/`): logo, prices for women and men, styles, reviews and social links, in IT · EN · DE · FR · ES. Every "Book" button opens WhatsApp with a ready-made message in the visitor's language.
- **Precious Studio** (`/#studio`): her private tools. Bookmark it on her phone.
  - **Agenda**: appointments by day, a one-tap WhatsApp confirmation, and buttons for done, no-show and cancel.
  - **Clients**: phone, language, notes and WhatsApp consent.
  - **Stock**: +/− counters, low-stock alerts and a shopping list she can copy.
  - **Follow-ups**: thank-you and review requests, rebook reminders and win-back messages, sent in each client's language. They follow strict rules so clients aren't pestered:
    - only clients who agreed
    - at most one message every 14 days
    - no reminder if the client already has a booking
    - every reminder offers STOP
  - **Replies & backup**: away and greeting texts in 5 languages for WhatsApp Business, plus backup and restore.

## Before going live

1. Edit `site/src/config.ts`: her WhatsApp number, Instagram, TikTok and Google review link.
2. Replace the photos. The photos in `site/public/gallery/` come from the reference PDFs and show **other stylists' work**, some with their watermarks. They carry a "Sample photo" badge on the site.
   - To replace them, put her own photos in `site/public/gallery/`, then list each one in `site/src/data/gallery.json` with `"own": true`.
   - Keep the `.webp` format, about 800px wide.
3. Change prices in `site/src/data/services.json`. The website and the studio both read from it.

## Showing new work

Add photos to `public/gallery/` and `gallery.json`, then rebuild and redeploy. The marquee, the About circles and the Styles cards pick photos by file name, in `sections/Marquee.tsx`, `About.tsx` and `Styles.tsx`.

## Run and deploy

```bash
cd precious/site
npm install
npm run dev        # local preview
npm run build      # static site in dist/; host on Vercel, Netlify or any static host
node --experimental-strip-types src/studio/store.test.ts   # follow-up rule checks
```

## Limits to know

- Studio data is stored **only in the browser where it's used**. If she uses it on her phone, it lives on her phone, so she should download a backup weekly from "Replies & backup". Sharing between devices would need a small backend.
- Messages are prepared in the studio, but **she sends each one** with a tap on WhatsApp. Sending automatically would need the paid WhatsApp Business API.
- For answering when she's busy, WhatsApp Business's own away and greeting messages do the work. The texts are ready to paste in the studio.
- The studio screens are in English. The messages sent to clients use each client's language.
