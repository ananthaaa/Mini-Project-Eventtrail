import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves at /Mini-Project-Eventtrail/ — use '/' for local dev via VITE env
  base: process.env.NODE_ENV === 'production' ? '/Mini-Project-Eventtrail/' : '/',
  define: {
    // Fix amazon-cognito-identity-js using Node.js `global` in browser
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mapbox-gl') || id.includes('node_modules/maplibre-gl')) {
            return 'map-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
