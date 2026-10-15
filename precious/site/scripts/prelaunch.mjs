// Blocks a production build while anything that could get the salon sued or fined is still in it.
// Run by `npm run release` (the Vercel build command). Override only for test deploys: ALLOW_PLACEHOLDERS=1
import { readFileSync } from 'node:fs'

const problems = []
const gallery = JSON.parse(readFileSync(new URL('../src/data/gallery.json', import.meta.url)))
const notOwn = gallery.items.filter((g) => !g.own)
if (notOwn.length) problems.push(`${notOwn.length} gallery photos are other stylists' work (own: false). Replace them with Precious's own photos, with each client's written consent (see precious/legal/liberatoria-foto.md).`)

const config = readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8')
for (const [label, placeholder] of [['Instagram', "'https://instagram.com/'"], ['TikTok', "'https://tiktok.com/'"], ['Google review', "'https://g.page/r/'"]])
  if (config.includes(placeholder)) problems.push(`${label} link in src/config.ts is still a placeholder.`)

if (problems.length) {
  console.error('\n✗ Not ready to go live:\n' + problems.map((p) => '  • ' + p).join('\n') + '\n')
  if (process.env.ALLOW_PLACEHOLDERS !== '1') process.exit(1)
  console.error('ALLOW_PLACEHOLDERS=1 set: building anyway (test deploy only, do not share the link publicly).\n')
} else console.log('✓ Pre-launch checks passed')
