/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', 'sans-serif'],
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      colors: {
        brand: {
          primary: '#5B4B8A',
          'primary-dark': '#483D6B',
          'primary-light': '#7B6BA8',
          accent: '#C4A77D',
          'accent-light': '#E8DCC8',
        },
        semantic: {
          success: '#4A7C59',
          'success-light': '#E8F0EA',
          warning: '#C4A35A',
          'warning-light': '#FBF6E9',
          error: '#B5495B',
          'error-light': '#F9EAEC',
          info: '#4A6B8A',
          'info-light': '#E8EEF3',
        },
        neutral: {
          50: '#FAFAF8',
          100: '#F5F4F0',
          200: '#E8E6E0',
          300: '#D4D1C9',
          400: '#A8A49A',
          500: '#7A766C',
          600: '#5C5850',
          700: '#3E3B35',
          800: '#2A2825',
          900: '#1A1917',
        },
        warm: {
          cream: '#FAF8F5',
          ivory: '#F5F2ED',
          sand: '#E8E2D9',
          stone: '#D4CCC1',
        },
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in': 'fade-in 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gentle': 'pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      boxShadow: {
        'soft': '0 2px 12px -3px rgba(91, 75, 138, 0.08), 0 4px 20px -5px rgba(91, 75, 138, 0.06)',
        'card': '0 1px 3px rgba(26, 25, 23, 0.03), 0 6px 16px rgba(26, 25, 23, 0.04)',
        'elevated': '0 8px 30px -8px rgba(91, 75, 138, 0.12), 0 12px 40px -12px rgba(91, 75, 138, 0.1)',
        'button-hover': '0 8px 24px -4px rgba(91, 75, 138, 0.3)',
        'input-focus': '0 0 0 3px rgba(91, 75, 138, 0.15)',
        'glow': '0 0 40px rgba(196, 167, 125, 0.2)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #FAF8F5 0%, #F5F2ED 50%, #FAF8F5 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(91, 75, 138, 0.02) 0%, rgba(196, 167, 125, 0.04) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #5B4B8A 0%, #7B6BA8 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
