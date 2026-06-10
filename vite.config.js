import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root base while serving locally; keep `/Portfolio/` for production builds (gh-pages).
  base: command === 'serve' ? '/' : '/Portfolio/',
}));