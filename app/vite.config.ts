import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { codeToHtml } from 'shiki'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `import html from './snippet.cs?highlight'` returns the file as Shiki-highlighted HTML.
 * Runs at build time, so neither Shiki nor its grammars end up in the browser bundle.
 */
function highlight(): Plugin {
  return {
    name: 'shiki-highlight',
    async load(id) {
      const [path, query] = id.split('?')
      if (query !== 'highlight') return
      this.addWatchFile(path)
      const code = (await readFile(path, 'utf8')).trimEnd()
      const html = await codeToHtml(code, {
        lang: extname(path).slice(1),
        theme: 'github-dark-default',
      })
      return `export default ${JSON.stringify(html)}`
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    // Same-origin requests to the ASP.NET Core API: no CORS, and every response header is readable from JS.
    // `vite preview` reuses this proxy. API_URL is set by docker-compose.yml.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:5201' },
    // Vite's CORS middleware would add `Vary: Origin` to every response, muddying the Vary lesson.
    cors: false,
  },
  plugins: [
    devtools(),
    highlight(),
    tailwindcss(),
    tanstackStart({
      // Static build for production: ASP.NET Core serves dist/client from wwwroot next to /api (see API/Program.cs).
      // Every page linked from the sidebar is prerendered; `_shell.html` is the client-only fallback for other URLs.
      prerender: { enabled: true, crawlLinks: true },
      spa: { enabled: true, maskPath: '/?shell' },
    }),
    viteReact(),
  ],
})

export default config
