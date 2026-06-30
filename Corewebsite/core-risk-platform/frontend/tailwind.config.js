/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CORE brand palette
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        // Risk severity
        critical: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
        high:     { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
        medium:   { bg: '#fefce8', text: '#713f12', border: '#fde047' },
        low:      { bg: '#f0fdf4', text: '#14532d', border: '#86efac' },
      },
    },
  },
  plugins: [],
};
