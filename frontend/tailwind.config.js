/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './layouts/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        lunea: {
          bg: '#FFF9FA',
          pink: '#E889A5',
          dark: '#241B1F',
          muted: '#6F6267',
          line: '#F0DDE2',
          blush: '#FBECEF',
          accent: '#D9688A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(36, 27, 31, 0.06)',
        lift: '0 10px 30px rgba(36, 27, 31, 0.05)',
      },
      maxWidth: {
        page: '1180px',
      },
    },
  },
  plugins: [],
};
