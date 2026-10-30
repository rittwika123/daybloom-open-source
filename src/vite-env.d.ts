
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { VitePWA } = require('vite-plugin-pwa')

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'DayBloom — Gentle Daily Planner',
        short_name: 'DayBloom',
        description:
          'A gentle little space to plan your day and grow at your own pace.',
        theme_color: '#fff7fa',
        background_color: '#fff9fc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
  },
})
