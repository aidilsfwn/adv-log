import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { sites } from '@openai/sites-vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sites(), {
    name: 'adv-log-sites-worker',
    closeBundle() {
      mkdirSync('dist/server', { recursive: true })
      writeFileSync('dist/server/index.js', `export default { async fetch(request, env) {
  const response = await env.ASSETS.fetch(request)
  if (response.status !== 404) return response
  const url = new URL(request.url)
  url.pathname = '/index.html'
  return env.ASSETS.fetch(new Request(url, request))
} }\n`)
    },
  }],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
