import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The landing page is its own chunk, so normally its code only starts
// downloading after the main bundle has run. On the home page, start it
// straight away, at the same time as the main bundle. Other pages skip it.
function preloadLanding() {
  let base = '/'
  return {
    name: 'preload-landing',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const chunks = Object.values(bundle ?? {}).filter((c) => c.type === 'chunk')
        const entry = chunks.find((c) => c.isEntry)
        const landing = chunks.find((c) => c.facadeModuleId?.replaceAll('\\', '/').endsWith('/src/pages/Landing.jsx'))
        if (!entry || !landing) return html
        const loaded = new Set([entry.fileName, ...entry.imports])
        const links = [
          ...[landing.fileName, ...landing.imports].filter((f) => !loaded.has(f)).map((f) => ['modulepreload', base + f]),
          ...[...(landing.viteMetadata?.importedCss ?? [])].map((f) => ['preload', base + f]),
        ]
        const script =
          `if (location.pathname === '/') for (const [rel, href] of ${JSON.stringify(links)}) {` +
          ` const l = document.createElement('link'); l.rel = rel; if (rel === 'preload') l.as = 'style';` +
          ` l.crossOrigin = ''; l.href = href; document.head.appendChild(l) }`
        // At the top of <head>: a script placed after a stylesheet waits for it.
        return [{ tag: 'script', children: script, injectTo: 'head-prepend' }]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadLanding()],
})
