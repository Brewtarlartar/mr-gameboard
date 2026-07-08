import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tavern semantic tokens — values live as RGB triples in
        // app/globals.css :root. rgb(var() / <alpha-value>) keeps Tailwind
        // opacity modifiers working (bg-surface/80, border-edge/60, ...).
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          high: 'rgb(var(--surface-high) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          strong: 'rgb(var(--gold-strong) / <alpha-value>)',
          deep: 'rgb(var(--gold-deep) / <alpha-value>)',
        },
        edge: 'rgb(var(--edge) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        // Elevation scale for the dark theme + the signature gold-glow
        // (glow values codify the shipped GameCard hover).
        'tavern-1': '0 1px 2px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)',
        'tavern-2': '0 4px 12px rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.35)',
        'tavern-3': '0 12px 32px rgba(0,0,0,0.55), 0 24px 64px rgba(0,0,0,0.45)',
        'gold-glow': '0 0 18px -4px rgba(251,191,36,0.45)',
        'gold-glow-strong': '0 0 24px -2px rgba(251,191,36,0.55), 0 0 64px -12px rgba(245,158,11,0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // `serif` was never defined, so the ~368 `font-serif` classes across the
        // app silently fell back to Times/Georgia. EB Garamond is the app's book
        // serif (narrative + most titles); `display` is Cinzel for brand-mark
        // headings (the base h1–h6 rule and the logo use font-display).
        serif: ['EB Garamond', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        display: ['Cinzel', 'EB Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
