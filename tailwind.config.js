/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          app: 'var(--bg-app)',
          card: 'var(--bg-card)',
          secondary: 'var(--bg-card-secondary)',
          input: 'var(--bg-input)',
          border: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
          main: 'var(--text-main)',
          sub: 'var(--text-sub)',
          muted: 'var(--text-muted)',
          header: 'var(--header-bg)',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#025aa1',
          800: '#064d85',
          900: '#0a406e',
          950: '#072949',
        }
      },
      screens: {
        'xs': '420px',
      }
    },
  },
  plugins: [],
}
