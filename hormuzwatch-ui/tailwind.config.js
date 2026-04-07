/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hw: {
          bg:       '#0d0d14',
          card:     '#1a1a28',
          'card-hi':'#1e1e30',
          border:   '#2a2a3a',
          'border-hi': '#34344a',
          gold:     '#e8b84b',
          'gold-dim':'#b8902e',
          blue:     '#3b82f6',
          green:    '#10b981',
          red:      '#ef4444',
          text:     '#e2e8f0',
          sub:      '#94a3b8',
          muted:    '#64748b',
          faint:    '#1e293b',
        },
      },
      fontFamily: {
        mono:  ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
