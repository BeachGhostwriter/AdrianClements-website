import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // CORE platform brand palette
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#2f4ac9',
          700: '#2340b0',
          900: '#1a2f7a',
        },
        risk: {
          critical: '#dc2626',
          high:     '#ea580c',
          medium:   '#d97706',
          low:      '#16a34a',
          monitor:  '#6b7280',
        },
        forge: {
          emergency:   '#7f1d1d',
          crisis:      '#dc2626',
          accelerated: '#f97316',
          standard:    '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
