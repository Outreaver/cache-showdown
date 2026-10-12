import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    // Same-origin requests to the ASP.NET Core API: no CORS, and every response header is readable from JS.
    proxy: { '/api': 'http://localhost:5201' },
    // Vite's CORS middleware would add `Vary: Origin` to every response, muddying the Vary lesson.
    cors: false,
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
