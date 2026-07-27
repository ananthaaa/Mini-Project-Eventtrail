import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Fix amazon-cognito-identity-js using Node.js `global` in browser
    global: 'globalThis',
  },
})
