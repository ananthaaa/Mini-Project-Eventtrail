/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-neobrutalist': '#F9F5F6',
        'accent-yellow': '#FFDB58',
        'pastel-mint': '#DAF5F0',
        'pastel-peach': '#F8D6B3',
        'pastel-yellow': '#FDFD96',
        'border-black': '#000000',
      },
      fontFamily: {
        display: ['"Epilogue"', '"Epilogue Placeholder"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        'neobrutalist-sm': '2px 2px 0px 0px #000',
        'neobrutalist': '4px 4px 0px 0px #000',
        'neobrutalist-lg': '6px 6px 0px 0px #000',
      }
    },
  },
  plugins: [],
}

