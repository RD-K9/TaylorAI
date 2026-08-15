/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fashion: {
          primary: '#4f46e5',
          accent: '#ec4899',
          surface: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};
