// Builds the studio as ONE offline HTML file (dist-file/Precious-Studio.html) that opens by double-click.
// Run: npm run studio:file
import { build } from 'vite'
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'

process.env.VITE_APP = 'studio'
await build({ logLevel: 'warn', build: { outDir: 'dist-file', assetsInlineLimit: 1e9, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } } })
const d = 'dist-file/', a = readdirSync(d + 'assets')
let html = readFileSync(d + 'index.html', 'utf8')
  .replace(/<script type="module" crossorigin src="[^"]+"><\/script>/, '')
  .replace(/<link rel="stylesheet" crossorigin href="[^"]+">/, '')
const js = readFileSync(d + 'assets/' + a.find((f) => f.endsWith('.js')), 'utf8').replace(/<\/script/g, '<\\/script')
const css = readFileSync(d + 'assets/' + a.find((f) => f.endsWith('.css')), 'utf8')
const logo = 'data:image/webp;base64,' + readFileSync('public/brand/logo-disc.webp').toString('base64')
html = html.replace('</head>', `<style>${css}</style></head>`).replace('</body>', `<script type="module">${js.replaceAll('brand/logo-disc.webp', logo)}</script></body>`)
  .replaceAll('href="brand/favicon.png"', `href="${logo}"`)
rmSync(d, { recursive: true }); mkdirSync(d)
writeFileSync(d + 'Precious-Studio.html', html)
