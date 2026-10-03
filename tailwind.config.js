/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#F0F9FF',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          accent: '#00F0FF',
        },
        surface: {
          base: '#0B0F19',
          card: '#111827',
          subtle: '#162032',
          border: '#1F293D',
          borderLight: '#2D3A54',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px rgba(14, 165, 233, 0.3)',
        'pro-card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
