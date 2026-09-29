#!/usr/bin/env node
/* Generates the official fidelity QR code for Hamburgheria del Contadino.
 *
 *   node tools/make-fidelity-qr.js
 *
 * Writes to qr/:
 *   fidelity-qr.svg          vector QR (use this for print shops)
 *   fidelity-qr.png          2048 px raster QR
 *   fidelity-poster.html     printable A5 counter/table card
 *   fidelity-poster.pdf/.png rendered card (only when Playwright is installed)
 *
 * Every raster output is decoded back with jsQR and must equal TARGET_URL. */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const qrcode = require('../vendor/qrcode.js');
const jsQR = require('../vendor/jsQR.js');

const TARGET_URL = 'https://lhamburgerdelcontadino.plateform.app/frontpage/fidelity';
const RESTAURANT = 'Hamburgheria del Contadino';
const OUT = path.join(__dirname, '..', 'qr');
const QUIET = 4; // modules of white border required by the QR spec
const PNG_TARGET_PX = 2048;

// Error correction H survives ~30% damage: stains, scratches, worn table cards.
const qr = qrcode(0, 'H');
qr.addData(TARGET_URL);
qr.make();
const n = qr.getModuleCount();
const size = n + QUIET * 2;

function svg({ fg = '#000000', bg = '#ffffff' } = {}) {
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code: ${TARGET_URL}">` +
    `<title>${RESTAURANT} — Carta Fedeltà</title>` +
    `<rect width="${size}" height="${size}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>\n`;
}

// ---- Minimal greyscale PNG encoder (no dependencies) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, k) => {
  let c = k;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function pngRaster() {
  const scale = Math.floor(PNG_TARGET_PX / size);
  const px = size * scale;
  const gray = Buffer.alloc(px * px, 255);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      for (let y = 0; y < scale; y++) {
        gray.fill(0, ((r + QUIET) * scale + y) * px + (c + QUIET) * scale, ((r + QUIET) * scale + y) * px + (c + QUIET + 1) * scale);
      }
    }
  }
  const raw = Buffer.alloc(px * (px + 1));
  for (let y = 0; y < px; y++) gray.copy(raw, y * (px + 1) + 1, y * px, (y + 1) * px); // filter byte 0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0); ihdr.writeUInt32BE(px, 4);
  ihdr[8] = 8; ihdr[9] = 0; // 8-bit greyscale
  const dpi = Buffer.alloc(9); // 300 dpi => 11811 px/m, so 2048 px prints at ~17 cm
  dpi.writeUInt32BE(11811, 0); dpi.writeUInt32BE(11811, 4); dpi[8] = 1;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('pHYs', dpi),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
  return { png, gray, px, scale };
}

function verify(gray, px, label) {
  const rgba = new Uint8ClampedArray(px * px * 4);
  for (let i = 0; i < gray.length; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = gray[i]; rgba[i * 4 + 3] = 255; }
  const got = jsQR(rgba, px, px)?.data;
  if (got !== TARGET_URL) throw new Error(`${label} decodes to ${JSON.stringify(got)}, expected ${TARGET_URL}`);
  console.log(`✓ ${label} decodes to ${got}`);
}

function poster(qrSvg) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>${RESTAURANT} — Carta Fedeltà</title>
<style>
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: "Helvetica Neue", Arial, "Liberation Sans", sans-serif; color: #1e2419; background: #f5f1df; }
  .card {
    width: 148mm; height: 210mm; padding: 14mm 14mm 11mm; display: flex; flex-direction: column; align-items: center;
    background: #f5f1df; border-top: 5mm solid #e0a526; text-align: center;
  }
  .eyebrow { font-size: 9pt; letter-spacing: .32em; text-transform: uppercase; color: #2f4a2b; font-weight: 700; }
  h1 { font-family: "Arial Black", "Helvetica Neue", Arial, sans-serif; font-weight: 900; font-size: 27pt; line-height: 1.02; margin: 3mm 0 0; color: #2f4a2b; }
  .tag { font-size: 13pt; margin: 3mm 0 0; }
  .qr { margin: 7mm 0 0; background: #fff; padding: 4mm; border-radius: 5mm; border: .6mm solid #2f4a2b; }
  .qr svg { width: 78mm; height: 78mm; display: block; }
  .cta { margin-top: 6mm; font-size: 15pt; font-weight: 700; color: #2f4a2b; }
  ol { list-style: none; padding: 0; margin: 5mm 0 0; display: flex; gap: 4mm; width: 100%; }
  li { flex: 1; font-size: 9pt; line-height: 1.3; border-top: .5mm solid #2f4a2b; padding-top: 2.5mm; }
  li b { display: block; font-size: 11pt; color: #b07a10; }
  .url { margin-top: auto; font-family: "DejaVu Sans Mono", Menlo, monospace; font-size: 7.5pt; color: #4a5342; word-break: break-all; }
</style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">Carta Fedeltà</div>
    <h1>${RESTAURANT}</h1>
    <p class="tag">Ogni burger ti fa guadagnare punti.</p>
    <div class="qr">${qrSvg}</div>
    <p class="cta">Inquadra il QR con la fotocamera</p>
    <ol>
      <li><b>1 · Iscriviti</b>Apri la sezione fedeltà e attiva la tua carta.</li>
      <li><b>2 · Mostra</b>Fai scansionare la tua carta alla cassa.</li>
      <li><b>3 · Premi</b>Accumula punti e riscatta i premi.</li>
    </ol>
    <p class="url">${TARGET_URL}</p>
  </div>
</body>
</html>
`;
}

async function renderPoster(htmlPath) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    try {
      const root = require('child_process').execSync('npm root -g').toString().trim();
      ({ chromium } = require(path.join(root, 'playwright')));
    } catch (e2) {
      console.log('• Playwright not found: skipped fidelity-poster.pdf/.png (open the .html and print to A5 instead)');
      return;
    }
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 3 });
    await page.goto('file://' + htmlPath);
    await page.pdf({ path: path.join(OUT, 'fidelity-poster.pdf'), format: 'A5', printBackground: true, preferCSSPageSize: true });
    const shot = await page.screenshot({ path: path.join(OUT, 'fidelity-poster.png'), fullPage: false });
    console.log(`✓ fidelity-poster.pdf (A5) and fidelity-poster.png (${shot.length} bytes)`);
    // The printed card must scan too: decode the rendered poster.
    const got = await page.evaluate(async () => {
      const svgEl = document.querySelector('.qr svg');
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgEl.outerHTML)));
      await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = 600;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 600, 600);
      return x.getImageData(0, 0, 600, 600).data;
    });
    const data = new Uint8ClampedArray(Object.values(got));
    const decoded = jsQR(data, 600, 600)?.data;
    if (decoded !== TARGET_URL) throw new Error(`poster QR decodes to ${JSON.stringify(decoded)}`);
    console.log(`✓ poster QR decodes to ${decoded}`);
  } finally {
    await browser.close();
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const vector = svg();
  fs.writeFileSync(path.join(OUT, 'fidelity-qr.svg'), vector);
  console.log(`✓ fidelity-qr.svg (version ${(n - 17) / 4}, ${n}×${n} modules, error correction H)`);

  const { png, gray, px } = pngRaster();
  fs.writeFileSync(path.join(OUT, 'fidelity-qr.png'), png);
  console.log(`✓ fidelity-qr.png (${px}×${px} px, 300 dpi)`);
  verify(gray, px, 'fidelity-qr.png');

  const htmlPath = path.join(OUT, 'fidelity-poster.html');
  fs.writeFileSync(htmlPath, poster(svg({ fg: '#15200f' })));
  console.log('✓ fidelity-poster.html');
  await renderPoster(htmlPath);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
