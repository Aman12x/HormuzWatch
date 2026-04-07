/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hw: {
          bg:       '#181c2a',
          card:     '#232840',
          'card-hi':'#2a2f4a',
          border:   '#3a4060',
          'border-hi': '#4a5070',
          gold:     '#f0c060',
          'gold-dim':'#c89a40',
          blue:     '#60a0f0',
          green:    '#34d399',
          red:      '#f87171',
          text:     '#f0f4ff',
          sub:      '#b0bcdc',
          muted:    '#8090b8',
          faint:    '#2a3050',
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
