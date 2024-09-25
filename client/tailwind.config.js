/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['"Poppins"', 'sans-serif'],
      },
      colors: {
        darkorange: '#E35903',
        coolerorange: '#FFA500',
        primaryOrange: '#F37006',
      },
    },
  },
  plugins: [],
}

