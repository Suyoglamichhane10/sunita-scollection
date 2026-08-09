/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sunita's Collection — Elegance brand palette
        primary: {
          DEFAULT: '#6B2D5C',      // Deep Purple (elegance)
          light: '#8A3D77',
          dark: '#4E1F43',
          50: '#FAF3F8',
          100: '#F3E3EF',
          200: '#E3C2DA',
          300: '#CF9BC0',
          400: '#B874A6',
500: '#8A3D77',
          600: '#6B2D5C',
          700: '#542344',
          800: '#3D1A33',
          900: '#2A1223',
          950: '#1F0D1A',
        },
        gold: {
          DEFAULT: '#C9A855',      // Luxury gold
          light: '#D9BE7A',
          dark: '#A8893B',
          50: '#FBF8EF',
          100: '#F5EDD8',
          200: '#EAD9AA',
          300: '#DFC57D',
          400: '#D4B266',
500: '#C9A855',
          600: '#A8893B',
          700: '#866B2E',
          800: '#654E22',
          900: '#453417',
          950: '#2E2310',
        },
blush: {
          DEFAULT: '#F4E1E1',      // Soft Pink (femininity)
          light: '#FAEFEF',
          dark: '#E8C9C9',
          50: '#FDF4F4',
          100: '#FAE9E9',
          200: '#F4D4D4',
          300: '#ECBABA',
          400: '#E29A9A',
          500: '#D47878',
          600: '#C05353',
          700: '#A03F3F',
          800: '#7E3030',
          900: '#5C2424',
          950: '#3A1616',
        },
        cream: {
          DEFAULT: '#FFF8F0',      // Warm cream background
          light: '#FFFDF8',
          dark: '#F5E9DA',
        },
ink: {
          DEFAULT: '#2D1B2B',      // Readable dark text
          light: '#5A4458',
          dark: '#1A0F19',
          950: '#120A10',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        script: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        elegant: '0 10px 40px -12px rgba(42,18,35,0.2)',
        luxury: '0 20px 60px -15px rgba(107,45,92,0.35)',
        card: '0 4px 20px rgba(42,18,35,0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
