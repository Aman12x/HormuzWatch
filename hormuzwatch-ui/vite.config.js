import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static archive build. No dev proxy and no API: every number the app renders
// comes from src/data/*.js, frozen at the June 18 2026 reopening.
//
// Hosted at aman12x.github.io/HormuzWatch/, so production assets live under
// the /HormuzWatch/ project subpath. Local dev serves from the root.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/HormuzWatch/' : '/',
})
