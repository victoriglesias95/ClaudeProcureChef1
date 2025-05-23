// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind colors
        primary: {
          DEFAULT: '#7D2027',
          light: '#9A3842',
          dark: '#5E1A1F',
        },
        accent: {
          DEFAULT: '#565F6E',
          light: '#6E7889',
          dark: '#404654',
        },
        background: {
          DEFAULT: '#FFFFFF',
          off: '#F8F8F8',
        },
        highlight: {
          DEFAULT: '#3C6E57',
          light: '#548F72',
          dark: '#2A5040',
        },
        error: '#D32F2F',
        success: '#2E7D32',
        warning: '#ED6C02',
        info: '#0288D1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}