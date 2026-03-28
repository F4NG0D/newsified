import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1a1a2e',
          accent: '#16213e',
          highlight: '#0f3460',
          gold: '#e94560',
          xp: '#4ade80',
          streak: '#f97316',
        },
        surface: {
          light: '#f5f5f0',
          dark: '#111118',
          card: '#1e1e2e',
          border: '#2a2a3e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'xp-fill': 'xpFill 0.8s ease-out forwards',
        'toast-up': 'toastUp 2.5s ease-out forwards',
        'badge-pop': 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        xpFill: {
          '0%': { width: 'var(--xp-from)' },
          '100%': { width: 'var(--xp-to)' },
        },
        toastUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '20%': { opacity: '1', transform: 'translateY(0)' },
          '80%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
