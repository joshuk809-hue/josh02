# Precious Beauty NFC business card

| File | What it is |
|---|---|
| `precious-nfc-card-print.pdf` | Print file: 2 pages (front, back), 89.6 × 58 mm = 85.6 × 54 mm card + 2 mm bleed on each side |
| `card-front.png`, `card-back.png` | 600 dpi proofs |
| `card-mockup.png` | Preview of the finished card |
| `build.cjs` | Rebuilds all of the above (`NODE_PATH=$(npm root -g) node precious/nfc-card/build.cjs`) |

## What happens when someone taps it

1. The card's NFC chip opens **`https://<her-domain>/#card`**, a branded page in the phone's language (IT, EN, DE, FR, ES).
2. **Chiedi info su WhatsApp** opens WhatsApp to +39 371 578 0893 with the message already written ("Ciao Precious! Ho il tuo biglietto da visita e vorrei più informazioni…"). The person taps **Send**.
3. **Salva contatto** opens her contact card, with logo, phone and services, in the phone's Contacts. The person taps **Save**.

The QR code on the back opens WhatsApp directly with a short info request. It works for phones without NFC, and it works today, before the website is online.

Why each step takes a tap: no phone lets a card add a contact or send a message by itself. iPhone and Android always ask the owner to confirm, and iPhones only open web links from NFC tags. The tap page is the setup that works on both.

## Ordering

Ask the printer for:

- **Card**: matte (soft-touch) black PVC, CR80 size (85.6 × 54 mm), 0.76 mm thick, rounded corners.
- **Chip**: NTAG215 or NTAG216, embedded, **not** a sticker.
- **Print**: full colour from the PDF. For extra shine, ask for gold hot-foil on the text on the back ("PRECIOUS BEAUTY", the phone number, the rule). The printer can trace those from the PDF; the logo itself is a photo-style artwork, so it prints in colour rather than foil.
- **Encoding**: many NFC card printers will write the link for you. Give them the URL from step 1.

## Writing the chip yourself

1. Put the website online (e.g. Vercel). The tap page is `https://<domain>/#card`.
2. Install **NFC Tools** (free, iPhone and Android).
3. Write → Add a record → **URL / URI** → `https://<domain>/#card` → Write, then hold the card to the phone.
4. Test with an iPhone and an Android phone, then **Other → Lock tag** in NFC Tools so nobody can overwrite it. Locking is permanent.

## Before printing

- Check the phone number on the proofs: **+39 371 578 0893**.
- The back says "Hair Salon · African Braider" and "Braids · Cornrows · Locs · Cuts · Lashes". Change them in `build.cjs` and rebuild if needed.
