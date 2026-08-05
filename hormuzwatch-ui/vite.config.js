import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static archive build. No dev proxy and no API: every number the app renders
// comes from src/data/*.js, frozen at the June 18 2026 reopening.
// `base` matches the GitHub Pages project path (username.github.io/HormuzWatch/).
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/HormuzWatch/' : '/',
})
