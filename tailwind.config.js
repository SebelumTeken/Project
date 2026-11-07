/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F3F3F5',
        text: '#1A1C1D',
        secondary: '#5F5E60',
        nav: '#414753',
        divider: '#D2D2D7',
        accent: '#0066CC',
        'accent-strong': '#004E9F',
        warning: '#B64400',
        danger: '#C9001A',
        success: '#1D7A3A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

