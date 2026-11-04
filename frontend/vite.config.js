import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/e-Certificate/" : "/",
  plugins: [react()],
  server: {
    // เปิด dev server ให้เครื่องอื่นในเครือข่ายเดียวกันเข้าถึงได้
    host: "0.0.0.0",
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
