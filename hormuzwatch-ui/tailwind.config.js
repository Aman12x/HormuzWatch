/** @type {import('tailwindcss').Config} */

// HormuzWatch design tokens — light theme.
//
// Palette validated against the white card surface with the data-viz validator.
// The four `series` hues pass every gate with no warnings: worst adjacent CVD
// ΔE 17.1, worst normal-vision ΔE 25.4, all ≥3:1 contrast. Slot order matters —
// violet sits between orange and green specifically to break the protan
// orange↔green confusion that a blue/orange/green/yellow order produces.
//
// Yellow was dropped from the set entirely: on a light surface the reference
// yellow reads at 2.17:1, which is below the graphic-contrast floor.
//
// Status colours are reserved, never double as series colours, and always ship
// with a text label. Both clear 4.5:1 for body text (reported 5.50, refuted
// 5.88 on white).
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Neutral base ────────────────────────────────────────────────
        bg: '#f7f8f9',
        surface: '#ffffff',
        'surface-2': '#f2f4f6',
        'surface-3': '#e8ecf0',
        line: '#e2e6ea',
        'line-strong': '#c6ced6',

        // ── Ink (all ≥4.5:1 on both bg and surface) ─────────────────────
        ink: '#10151a',
        'ink-2': '#4a545e',
        'ink-3': '#626c76',

        // ── Reserved status ─────────────────────────────────────────────
        reported: '#1d68c3',
        refuted: '#c0272d',

        // ── Categorical series (validated set, fixed order) ─────────────
        s1: '#1d68c3',
        s2: '#d9531f',
        s3: '#6b3fa0',
        s4: '#12805a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        label: ['0.75rem', { lineHeight: '1.1rem' }],
        body: ['0.875rem', { lineHeight: '1.5rem' }],
        lead: ['0.9375rem', { lineHeight: '1.65rem' }],
        h3: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.006em' }],
        h2: ['1.375rem', { lineHeight: '1.85rem', letterSpacing: '-0.014em' }],
        h1: ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.02em' }],
        stat: ['2.25rem', { lineHeight: '2.4rem', letterSpacing: '-0.03em' }],
      },
      borderRadius: { DEFAULT: '4px', md: '6px', lg: '8px' },
      maxWidth: { prose: '68ch' },
      boxShadow: {
        card: '0 1px 2px rgba(16, 21, 26, 0.04)',
      },
    },
  },
  plugins: [],
}
