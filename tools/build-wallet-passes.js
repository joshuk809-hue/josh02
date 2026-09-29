#!/usr/bin/env node
/* Builds the Apple Wallet and Google Wallet fidelity cards for Hamburgheria del Contadino.
 *
 *   node tools/build-wallet-passes.js                 # artwork + the three sample cards
 *   node tools/build-wallet-passes.js --card LHC-10458 --name "Marco Bianchi" \
 *        --spend 1290.00 --points 312 --since 2026-03-29   # one real customer
 *
 * Outputs (wallet/):
 *   art/<tier>/            rendered artwork (Apple @1x/@2x/@3x, Google hero + logo)
 *   build/apple/<card>.pass/   pass.json + images + manifest.json   (always)
 *   build/apple/<card>.pkpass  signed pass, ready for iPhone          (when Apple env vars are set)
 *   build/google/classes/<tier>.json, objects/<card>.json            (always)
 *   build/google/save-links.txt  "Add to Google Wallet" links         (when Google env vars are set)
 *
 * Apple signing (Apple Developer account → Certificates → Pass Type ID):
 *   APPLE_PASS_TYPE_ID=pass.it.hamburgheriadelcontadino.fidelity  APPLE_TEAM_ID=ABCDE12345
 *   APPLE_CERT_PEM=cert.pem  APPLE_KEY_PEM=key.pem  [APPLE_KEY_PASS=...]  APPLE_WWDR_PEM=AppleWWDRCAG4.pem
 * Contactless (optional, once approved): APPLE_NFC_PUBLIC_KEY=<base64 P-256 public key>  GOOGLE_SMART_TAP=1
 * Google (Google Pay & Wallet Console → Google Wallet API):
 *   GOOGLE_ISSUER_ID=3388000000012345678  GOOGLE_SA_KEY=service-account.json
 *   GOOGLE_IMAGE_BASE_URL=https://your-host/wallet/art   (public HTTPS copy of wallet/art)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const { TIERS, REWARDS, tierById, tierForSpend, BRAND, cardUrl } = require('../wallet/tiers.js');

const ROOT = path.join(__dirname, '..', 'wallet');
const ART = path.join(ROOT, 'art');
const BUILD = path.join(ROOT, 'build');
const env = process.env;

const SAMPLES = [
  { card: 'LHC-10717', name: 'Elena Bruno', spend: 13350, points: 46, since: '2026-09-16' },
  { card: 'LHC-10421', name: 'Giulia Rossi', spend: 55300, points: 164, since: '2026-03-27' },
  { card: 'LHC-10458', name: 'Marco Bianchi', spend: 129000, points: 312, since: '2026-03-29' },
];

// Apple sizes are in points; Google sizes are pixels.
const APPLE_IMAGES = { icon: [29, 29], logo: [160, 50], strip: [375, 123] };
const GOOGLE_IMAGES = { hero: [1032, 336], 'google-logo': [660, 660] };
// HD card face for the showcase page and the app (rendered at 3×: 3033×1914 px).
const CARD_IMAGE = { card: [1011, 638] };

// ---------------------------------------------------------------- helpers

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const eur = (cents) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const itDate = (iso) => new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(iso));
const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

function nextRewardText(points) {
  const next = REWARDS.find((r) => r.cost > points);
  if (!next) return 'Tutti i premi sbloccati';
  return `${next.label} · mancano ${next.cost - points} pt`;
}
function nextTierText(spend, tier) {
  const next = TIERS.find((t) => t.min > spend);
  return next ? `${eur(next.min - spend)} per diventare ${next.name}` : `Livello massimo: ${tier.name}`;
}

// Minimal ZIP writer (stored entries) so the build needs no npm packages.
const CRC = Array.from({ length: 256 }, (_, k) => {
  let c = k;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function zip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(useDeflate ? 8 : 0, 8); local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(useDeflate ? 8 : 0, 10); central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(body.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, body);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------------------------------------------------------------- artwork

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* try the global install */ }
  const root = execFileSync('npm', ['root', '-g']).toString().trim();
  return require(path.join(root, 'playwright'));
}

async function renderArtwork() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const artUrl = 'file://' + path.join(ROOT, 'design', 'art.html');
  const jobs = [];
  for (const tier of TIERS) {
    for (const [kind, [w, h]] of Object.entries(APPLE_IMAGES)) {
      for (const scale of [1, 2, 3]) jobs.push({ tier, kind, w, h, scale, file: `${kind}${scale > 1 ? `@${scale}x` : ''}.png` });
    }
    for (const [kind, [w, h]] of Object.entries(GOOGLE_IMAGES)) jobs.push({ tier, kind, w, h, scale: 1, file: `${kind}.png` });
    for (const [kind, [w, h]] of Object.entries(CARD_IMAGE)) jobs.push({ tier, kind, w, h, scale: 3, file: `${kind}@3x.jpg`, jpeg: true });
  }
  try {
    for (const scale of [1, 2, 3]) {
      const page = await browser.newPage({ deviceScaleFactor: scale });
      await page.goto(artUrl);
      for (const j of jobs.filter((x) => x.scale === scale)) {
        await page.setViewportSize({ width: j.w, height: j.h });
        await page.evaluate(([tier, kind, w, h]) => window.renderArt(tier, kind, w, h), [j.tier, j.kind, j.w, j.h]);
        const dir = path.join(ART, j.tier.id);
        fs.mkdirSync(dir, { recursive: true });
        const shot = j.jpeg ? { type: 'jpeg', quality: 92 } : { omitBackground: j.kind === 'logo' };
        await page.screenshot({ path: path.join(dir, j.file), ...shot, clip: { x: 0, y: 0, width: j.w, height: j.h } });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`✓ artwork: ${jobs.length} images in wallet/art/<tier>/`);
}

// ---------------------------------------------------------------- Apple Wallet

function applePassJson(c, tier) {
  const url = cardUrl(c.card);
  return {
    formatVersion: 1,
    passTypeIdentifier: env.APPLE_PASS_TYPE_ID || 'pass.it.hamburgheriadelcontadino.fidelity',
    teamIdentifier: env.APPLE_TEAM_ID || 'TEAMID0000',
    serialNumber: c.card,
    organizationName: BRAND.name,
    description: `${BRAND.program} ${BRAND.name} · ${tier.name}`,
    backgroundColor: rgb(tier.colors.background),
    foregroundColor: rgb(tier.colors.foreground),
    labelColor: rgb(tier.colors.label),
    sharingProhibited: true,
    storeCard: {
      headerFields: [{ key: 'tier', label: 'LIVELLO', value: tier.name.toUpperCase(), changeMessage: 'Benvenuto nel livello %@' }],
      primaryFields: [{ key: 'points', label: 'PUNTI', value: c.points, changeMessage: 'Ora hai %@ punti' }],
      secondaryFields: [{ key: 'member', label: 'SOCIO', value: c.name }],
      auxiliaryFields: [
        { key: 'next', label: 'PROSSIMO PREMIO', value: nextRewardText(c.points) },
        { key: 'since', label: 'DAL', value: itDate(c.since), textAlignment: 'PKTextAlignmentRight' },
      ],
      backFields: [
        { key: 'card', label: 'Numero carta', value: c.card },
        { key: 'perks', label: `Vantaggi ${tier.name}`, value: tier.perks.map((p) => `• ${p}`).join('\n') },
        { key: 'progress', label: 'Il tuo percorso', value: `${nextTierText(c.spend, tier)}.\nGermoglio → Raccolto (da ${eur(tierById.raccolto.min)}) → Riserva (da ${eur(tierById.riserva.min)}).` },
        { key: 'rewards', label: 'Premi', value: REWARDS.map((r) => `${r.label}: ${r.cost} punti`).join('\n') },
        { key: 'how', label: 'Come funziona', value: 'Avvicina il telefono al lettore contactless alla cassa, come per pagare: i punti si aggiungono da soli e puoi usarli per i premi.' },
        { key: 'web', label: 'La tua carta online', value: url },
        { key: 'motto', label: tier.name, value: tier.motto },
      ],
    },
    // Contactless only: no barcode. The reader receives the card number over NFC (Apple VAS).
    // Apple enables NFC for a Pass Type ID on request; its public key goes in APPLE_NFC_PUBLIC_KEY.
    ...(env.APPLE_NFC_PUBLIC_KEY ? { nfc: { message: c.card, encryptionPublicKey: env.APPLE_NFC_PUBLIC_KEY } } : {}),
  };
}

function signManifest(dir) {
  const need = ['APPLE_PASS_TYPE_ID', 'APPLE_TEAM_ID', 'APPLE_CERT_PEM', 'APPLE_KEY_PEM', 'APPLE_WWDR_PEM'];
  if (!need.every((k) => env[k])) return false;
  const args = ['smime', '-binary', '-sign', '-certfile', env.APPLE_WWDR_PEM, '-signer', env.APPLE_CERT_PEM,
    '-inkey', env.APPLE_KEY_PEM, '-in', path.join(dir, 'manifest.json'), '-out', path.join(dir, 'signature'), '-outform', 'DER'];
  if (env.APPLE_KEY_PASS) args.push('-passin', `pass:${env.APPLE_KEY_PASS}`);
  execFileSync('openssl', args, { stdio: 'inherit' });
  return true;
}

function buildApple(c, tier) {
  const dir = path.join(BUILD, 'apple', `${c.card}.pass`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pass.json'), JSON.stringify(applePassJson(c, tier), null, 2));
  for (const kind of Object.keys(APPLE_IMAGES)) {
    for (const suffix of ['', '@2x', '@3x']) fs.copyFileSync(path.join(ART, tier.id, `${kind}${suffix}.png`), path.join(dir, `${kind}${suffix}.png`));
  }
  const names = fs.readdirSync(dir).filter((f) => f !== 'manifest.json' && f !== 'signature').sort();
  const manifest = Object.fromEntries(names.map((f) => [f, sha1(fs.readFileSync(path.join(dir, f)))]));
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const pkpass = path.join(BUILD, 'apple', `${c.card}.pkpass`);
  if (signManifest(dir)) {
    const files = fs.readdirSync(dir).sort().map((f) => [f, fs.readFileSync(path.join(dir, f))]);
    fs.writeFileSync(pkpass, zip(files));
    return `signed → wallet/build/apple/${c.card}.pkpass`;
  }
  fs.rmSync(pkpass, { force: true });
  return 'bundle ready, unsigned (set the APPLE_* variables to produce .pkpass)';
}

// ---------------------------------------------------------------- Google Wallet

const issuer = () => env.GOOGLE_ISSUER_ID || 'ISSUER_ID';
const imageUrl = (tier, file) => `${(env.GOOGLE_IMAGE_BASE_URL || 'https://YOUR-HOST/wallet/art').replace(/\/$/, '')}/${tier.id}/${file}`;
const it = (value) => ({ defaultValue: { language: 'it-IT', value } });

function googleClass(tier) {
  return {
    id: `${issuer()}.hdc_fidelity_${tier.id}`,
    issuerName: BRAND.name,
    programName: `${BRAND.program} · ${tier.name}`,
    programLogo: { sourceUri: { uri: imageUrl(tier, 'google-logo.png') }, contentDescription: it(`${BRAND.name} logo`) },
    heroImage: { sourceUri: { uri: imageUrl(tier, 'hero.png') }, contentDescription: it(`Carta ${tier.name}`) },
    hexBackgroundColor: tier.colors.background,
    rewardsTier: tier.name,
    rewardsTierLabel: 'Livello',
    accountNameLabel: 'Socio',
    accountIdLabel: 'Carta',
    countryCode: 'IT',
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    homepageUri: { uri: BRAND.fidelityUrl, description: 'Sezione fedeltà' },
    // Smart Tap (Google's contactless loyalty) needs an issuer approved for it: GOOGLE_SMART_TAP=1.
    ...(env.GOOGLE_SMART_TAP ? { enableSmartTap: true, redemptionIssuers: [issuer()] } : {}),
    textModulesData: [
      { id: 'perks', header: `Vantaggi ${tier.name}`, body: tier.perks.join(' · ') },
      { id: 'rewards', header: 'Premi', body: REWARDS.map((r) => `${r.label}: ${r.cost} pt`).join(' · ') },
    ],
  };
}

function googleObject(c, tier) {
  const url = cardUrl(c.card);
  return {
    id: `${issuer()}.${c.card}`,
    classId: `${issuer()}.hdc_fidelity_${tier.id}`,
    state: 'ACTIVE',
    accountId: c.card,
    accountName: c.name,
    loyaltyPoints: { label: 'Punti', balance: { int: c.points } },
    secondaryLoyaltyPoints: { label: 'Speso', balance: { money: { micros: String(c.spend * 10000), currencyCode: 'EUR' } } },
    smartTapRedemptionValue: c.card, // sent to the till's reader on tap; no barcode
    hexBackgroundColor: tier.colors.background,
    textModulesData: [
      { id: 'next', header: 'Prossimo premio', body: nextRewardText(c.points) },
      { id: 'progress', header: 'Il tuo percorso', body: nextTierText(c.spend, tier) },
    ],
    linksModuleData: { uris: [{ uri: url, description: 'La tua carta online', id: 'card' }] },
  };
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

function saveLink(classes, objects) {
  if (!env.GOOGLE_ISSUER_ID || !env.GOOGLE_SA_KEY) return null;
  const sa = JSON.parse(fs.readFileSync(env.GOOGLE_SA_KEY, 'utf8'));
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const claims = {
    iss: sa.client_email, aud: 'google', typ: 'savetowallet', iat: Math.floor(Date.now() / 1000),
    origins: [], payload: { loyaltyClasses: classes, loyaltyObjects: objects },
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
  return `https://pay.google.com/gp/v/save/${unsigned}.${b64url(sig)}`;
}

function buildGoogle(customers) {
  const gdir = path.join(BUILD, 'google');
  fs.mkdirSync(path.join(gdir, 'classes'), { recursive: true });
  fs.mkdirSync(path.join(gdir, 'objects'), { recursive: true });
  for (const tier of TIERS) fs.writeFileSync(path.join(gdir, 'classes', `${tier.id}.json`), JSON.stringify(googleClass(tier), null, 2));
  const links = [];
  for (const c of customers) {
    const tier = tierForSpend(c.spend);
    const obj = googleObject(c, tier);
    fs.writeFileSync(path.join(gdir, 'objects', `${c.card}.json`), JSON.stringify(obj, null, 2));
    const link = saveLink([googleClass(tier)], [obj]);
    if (link) links.push(`${c.card}  ${c.name}  ${link}`);
  }
  const linkFile = path.join(gdir, 'save-links.txt');
  if (links.length) fs.writeFileSync(linkFile, links.join('\n') + '\n');
  else fs.rmSync(linkFile, { force: true });
  console.log(`✓ Google Wallet: ${TIERS.length} classes, ${customers.length} objects${links.length ? ', save links in wallet/build/google/save-links.txt' : ' (set GOOGLE_ISSUER_ID + GOOGLE_SA_KEY for save links)'}`);
}

// ---------------------------------------------------------------- main

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let customers = SAMPLES;
  if (args.card) {
    if (!args.name) throw new Error('--name is required with --card');
    customers = [{
      card: String(args.card).toUpperCase(),
      name: String(args.name),
      spend: Math.round(parseFloat(args.spend || '0') * 100),
      points: parseInt(args.points || '0', 10),
      since: args.since || new Date().toISOString().slice(0, 10),
    }];
  }
  if (!args['skip-art'] || !fs.existsSync(ART)) await renderArtwork();
  for (const c of customers) {
    const tier = tierForSpend(c.spend);
    console.log(`✓ Apple Wallet ${c.card} ${c.name} (${tier.name}): ${buildApple(c, tier)}`);
  }
  buildGoogle(customers);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
