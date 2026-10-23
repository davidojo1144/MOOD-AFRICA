/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E2582B',
          foreground: '#FFFFFF',
          50: '#FFF4ED',
          100: '#FFE5D4',
          200: '#FEC7A8',
          300: '#FDA071',
          400: '#F96E38',
          500: '#E2582B',
          600: '#C73F17',
          700: '#A52F15',
          800: '#842818',
          900: '#6B2416',
        },
        secondary: {
          DEFAULT: '#1F7A5C',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F2B33D',
          foreground: '#1C1917',
        },
        background: {
          DEFAULT: '#FFF7ED',
          dark: '#1C1917',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#292524',
        },
        foreground: {
          DEFAULT: '#1C1917',
          dark: '#FAFAF9',
        },
        muted: {
          DEFAULT: '#78716C',
          dark: '#A8A29E',
        },
        border: {
          DEFAULT: '#E7E5E4',
          dark: '#44403C',
        },
        destructive: '#DC2626',
        success: '#16A34A',
        warning: '#D97706',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
