import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Monitor Combustível - OBD2 AutoSync',
        short_name: 'OBD2 Sync',
        description: 'Registre abastecimentos com dados reais do OBD-II e salve no Google Drive.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/MonitorCombustivel/',
        scope: '/MonitorCombustivel/',
        icons: [
          { src: '/MonitorCombustivel/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/MonitorCombustivel/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/MonitorCombustivel/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: '/MonitorCombustivel/',
})
