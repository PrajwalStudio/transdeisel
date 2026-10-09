/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1a2744',
        accent: '#c0392b',
        surface: '#f5f7fb',
      },
      boxShadow: {
        panel: '0 12px 32px rgba(17, 34, 68, 0.08)',
      },
    },
  },
  plugins: [],
};
