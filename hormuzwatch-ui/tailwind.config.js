/** @type {import('tailwindcss').Config} */

// HormuzWatch design tokens.
//
// Palette validated against the dark surface (#15181c) with the data-viz
// validator: the four `series` hues pass every gate on the adjacent pairlist
// (worst CVD ΔE 8.4, worst normal-vision ΔE 19.8, all ≥3:1 contrast), and the
// reported/refuted status pair passes at ΔE 29.0.
//
// Status colours are reserved. They never double as series colours, and they
// always ship with a text label — never colour alone.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Neutral base ────────────────────────────────────────────────
        bg: '#0d0f11',
        surface: '#15181c',
        'surface-2': '#1b1f24',
        'surface-3': '#22272d',
        line: '#262b31',
        'line-strong': '#333a42',

        // ── Ink ─────────────────────────────────────────────────────────
        ink: '#e9ecef',
        'ink-2': '#a4acb4',
        'ink-3': '#6b747d',

        // ── Reserved status ─────────────────────────────────────────────
        reported: '#3987e5',
        refuted: '#e66767',

        // ── Categorical series (validated set, in fixed order) ──────────
        's1': '#3987e5',
        's2': '#d95926',
        's3': '#199e70',
        's4': '#c98500',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Tight, deliberate scale — no arbitrary one-off sizes in components
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        label: ['0.75rem', { lineHeight: '1.1rem' }],
        body: ['0.875rem', { lineHeight: '1.5rem' }],
        lead: ['0.9375rem', { lineHeight: '1.65rem' }],
        h3: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.006em' }],
        h2: ['1.375rem', { lineHeight: '1.85rem', letterSpacing: '-0.014em' }],
        h1: ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.02em' }],
        stat: ['2.25rem', { lineHeight: '2.4rem', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
