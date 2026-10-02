/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#172554',
          950: '#050816'
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#050816'
        },
        dark: {
          bg: '#050816',
          card: '#0F172A',
          border: 'rgba(148, 163, 184, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'hisab-spin': 'spin 2s linear infinite',
        'hisab-wave': 'hisabWave 0.5s ease forwards',
        'hisab-slide-down': 'hisabSlideDown 0.8s ease forwards',
        'hisab-disappear': 'hisabDisappear 0.6s ease forwards',
        'hisab-takeoff': 'hisabTakeOff 0.8s linear forwards',
        'hisab-land': 'hisabLand 0.6s ease forwards',
        'hisab-contrail': 'hisabContrail 0.8s linear forwards',
        'hisab-appear': 'hisabAppear 1.2s ease forwards',
      },
      keyframes: {
        hisabWave: {
          '30%': { opacity: '1', transform: 'translateY(4px)' },
          '50%': { opacity: '1', transform: 'translateY(-3px)', color: '#ff5569' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        hisabSlideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px) translateX(5px) rotate(-90deg)', color: '#ff5569', filter: 'blur(5px)' },
          '30%': { opacity: '1', transform: 'translateY(4px)', filter: 'blur(0)' },
          '50%': { transform: 'translateY(-3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        hisabDisappear: {
          'from': { opacity: '1' },
          'to': { opacity: '0', transform: 'translateX(5px) translateY(20px)', color: '#ff5569', filter: 'blur(5px)' },
        },
        hisabTakeOff: {
          '0%': { opacity: '1' },
          '60%': { opacity: '1', transform: 'translateX(70px) rotate(45deg) scale(2)' },
          '100%': { opacity: '0', transform: 'translateX(160px) rotate(45deg) scale(0)' },
        },
        hisabLand: {
          '0%': { transform: 'translateX(-60px) translateY(30px) rotate(-50deg) scale(2)', opacity: '0', filter: 'blur(3px)' },
          '100%': { transform: 'translateX(0) translateY(0) rotate(0) scale(1)', opacity: '1', filter: 'blur(0)' },
        },
        hisabContrail: {
          '0%': { width: '0', opacity: '1' },
          '8%': { width: '15px' },
          '60%': { opacity: '0.7', width: '80px' },
          '100%': { opacity: '0', width: '160px' },
        },
        hisabAppear: {
          '0%': { opacity: '0', transform: 'scale(4) rotate(-40deg)', color: '#ff5569', filter: 'blur(4px)' },
          '30%': { opacity: '1', transform: 'scale(0.6)', filter: 'blur(1px)' },
          '50%': { opacity: '1', transform: 'scale(1.2)', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
