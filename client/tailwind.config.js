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
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49'
        },
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#082F49'
        },
        dark: {
          bg: '#071A2B',
          card: '#0B2234',
          border: 'rgba(148, 190, 211, 0.16)'
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
