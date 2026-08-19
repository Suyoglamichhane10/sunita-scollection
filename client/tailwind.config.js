/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
// Sunita'z Collection — Feminine "Pink & Red" brand palette
        primary: {
          DEFAULT: '#E11D48',      // Pink-red (signature)
          light: '#F43F5E',
          dark: '#BE123C',
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519',
        },
        gold: {
          DEFAULT: '#C9A855',      // Champagne gold
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
          DEFAULT: '#FBE7EE',      // Soft pink background
          light: '#FDF2F7',
          dark: '#F5CFDC',
          50: '#FEF6F9',
          100: '#FCEDF3',
          200: '#F9DCE8',
          300: '#F3C3D7',
          400: '#EB9FBD',
          500: '#DF769F',
          600: '#C94F7D',
          700: '#AB3C66',
          800: '#832D50',
          900: '#5C203B',
          950: '#3B1327',
        },
        cream: {
          DEFAULT: '#FFF8F0',      // Warm cream
          light: '#FFFDF8',
          dark: '#F5E9DA',
        },
        ink: {
          DEFAULT: '#33202C',      // Readable warm dark text
          light: '#6E5567',
          dark: '#1D1119',
          950: '#140B11',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        script: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        elegant: '0 10px 40px -12px rgba(61,17,40,0.18)',
        luxury: '0 20px 60px -15px rgba(212,84,143,0.35)',
        card: '0 4px 20px rgba(61,17,40,0.07)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};

