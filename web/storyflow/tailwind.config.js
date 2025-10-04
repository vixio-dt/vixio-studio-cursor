/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          panel90: 'var(--panel-90)',
          panel80: 'var(--panel-80)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          1: 'var(--accent-1)',
          2: 'var(--accent-2)',
          warm: 'var(--accent-warm)',
          audio: 'var(--accent-audio)',
          lighting: 'var(--accent-lighting)',
        },
        accentSoft: {
          1: 'var(--accent-1-soft)',
          2: 'var(--accent-2-soft)',
          warm: 'var(--accent-warm-soft)',
          audio: 'var(--accent-audio-soft)',
          lighting: 'var(--accent-lighting-soft)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        brandSm: '8px',
        brandMd: '12px',
        brandLg: '16px',
      },
      boxShadow: {
        low: '0 2px 10px rgba(15,17,25,0.06)',
        mid: '0 10px 40px rgba(15,17,25,0.15)',
        high: '0 24px 60px rgba(15,17,25,0.25)',
      },
      backgroundImage: {
        'grad-brand': 'var(--grad-brand)',
        'grad-pill': 'var(--grad-pill)',
        'grad-panel': 'var(--grad-panel)',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        view: '280ms',
        hover: '120ms',
      },
    },
  },
  plugins: [],
}

