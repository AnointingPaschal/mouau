import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        mouau: {
          DEFAULT: '#1B5E20',
          dark: '#0D3B0F',
          mid: '#2E7D32',
          light: '#4CAF50',
          lighter: '#81C784',
          bg: '#F0F7F0',
          surface: '#E8F5E9'
        },
        gold: {
          DEFAULT: '#C9A227',
          dark: '#9A7B1C',
          light: '#D4B84A',
          lighter: '#F4D03F'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      backgroundImage: {
        'green-gradient': 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A227 0%, #D4B84A 100%)',
        'card-gradient': 'linear-gradient(135deg, #ffffff 0%, #F0F7F0 100%)'
      }
    }
  },
  plugins: []
}

export default config
