/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  safelist: [
    // arbitralne wartości, używane w kodzie i/lub wstawiane warunkowo
    { pattern: /z-\[(?:2000|2100|2150)\]/ },
    // jeżeli będziesz dodawać kolejne arbitralne klasy, możesz rozszerzyć:
    // { pattern: /z-\[\d+\]/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Poppins',
          'Segoe UI Emoji',
          'Apple Color Emoji',
          'Noto Color Emoji',
          'sans-serif',
        ],
      },
      animation: {
        fadeIn: 'fadeIn 3s ease-in-out forwards',
        fadeInLoop: 'fadeIn 3s ease-in-out infinite',
        fadeInLoopDelay: 'fadeInDelay 8s ease-in-out infinite',
        fadeIn1: 'fadeIn1 1s ease forwards',
        fadeIn2: 'fadeIn2 1s ease forwards 2s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInDelay: {
          '0%, 50%': { opacity: 0, transform: 'translateY(10px)' },
          '60%, 100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn1: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn2: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // wariant "contrast:" => body.contrast &
    plugin(function ({ addVariant }) {
      addVariant('contrast', 'body.contrast &')
    }),
  ],
}
