import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static archive build. No dev proxy and no API: every number the app renders
// comes from src/data/*.js, frozen at the June 18 2026 reopening.
//
// base is '/' because the site is served from the root of the custom domain
// hormuzwatch.singhaman.dev (see public/CNAME), not from a project subpath.
// If the custom domain is ever removed, this must go back to '/HormuzWatch/'
// or every asset will 404 on aman12x.github.io/HormuzWatch/.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
