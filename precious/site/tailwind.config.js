/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { kanit: ['Kanit', 'sans-serif'] },
      colors: { ink: '#0C0C0C', cream: '#F3EBDD', gold: '#D4A857', sand: '#E9D6B0' },
    },
  },
  plugins: [],
}
