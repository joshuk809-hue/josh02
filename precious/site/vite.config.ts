import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// Studio build only: makes it installable on the phone home screen (name, icon, offline).
const studioApp = (): Plugin => ({
  name: 'studio-app',
  transformIndexHtml: (html) => html
    .replace(/<title>[^<]*<\/title>/, '<title>Precious Studio</title>')
    .replace('</head>', `<link rel="manifest" href="manifest.webmanifest" />
    <link rel="apple-touch-icon" href="icon-180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Studio" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  </head>`),
  generateBundle() {
    const emit = (fileName: string, source: string | Uint8Array) => this.emitFile({ type: 'asset', fileName, source })
    for (const n of [180, 192, 512]) emit(`icon-${n}.png`, readFileSync(`src/studio/pwa/icon-${n}.png`))
    emit('sw.js', readFileSync('src/studio/pwa/sw.js', 'utf8'))
    emit('manifest.webmanifest', JSON.stringify({
      name: 'Precious Studio', short_name: 'Studio', start_url: './', scope: './', display: 'standalone',
      background_color: '#0C0C0C', theme_color: '#0C0C0C',
      icons: [192, 512].map((n) => ({ src: `icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
    }))
  },
})

export default defineConfig({ plugins: [react(), ...(process.env.VITE_APP === 'studio' ? [studioApp()] : [])], base: './' })
