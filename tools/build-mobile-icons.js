#!/usr/bin/env node
/* Renders the Contadino Club app icons (Riserva crest, black and gold) into mobile/icons/.
 *   node tools/build-mobile-icons.js */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { tierById } = require('../wallet/tiers.js');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* global install */ }
  return require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
}

const OUT = path.join(__dirname, '..', 'mobile', 'icons');
// `inset` shrinks the crest so maskable icons keep it inside the platform's safe circle.
const ICONS = [
  { file: 'icon-192.png', size: 192, inset: 1 },
  { file: 'icon-512.png', size: 512, inset: 1 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.92 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(__dirname, '..', 'wallet', 'design', 'art.html'));
    for (const ic of ICONS) {
      const inner = Math.round(ic.size * ic.inset);
      await page.setViewportSize({ width: ic.size, height: ic.size });
      await page.evaluate(([tier, s]) => window.renderArt(tier, 'icon', s, s), [tierById.riserva, inner]);
      await page.evaluate(([s, bg]) => {
        const el = document.getElementById('art');
        Object.assign(el.style, { width: `${s}px`, height: `${s}px`, display: 'grid', placeItems: 'center', background: bg });
      }, [ic.size, tierById.riserva.colors.background]);
      await page.screenshot({ path: path.join(OUT, ic.file), clip: { x: 0, y: 0, width: ic.size, height: ic.size } });
    }
  } finally {
    await browser.close();
  }
  console.log(`✓ ${ICONS.length} icons in mobile/icons/`);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
