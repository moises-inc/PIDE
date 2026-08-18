/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pide: {
          ink: '#071014',
          cyan: '#5de1e5',
          amber: '#efb65f',
        },
      },
    },
  },
  plugins: [],
};
