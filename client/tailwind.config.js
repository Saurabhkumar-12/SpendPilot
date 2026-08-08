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
        forest: {
          deep: '#092B20',
          dark: '#071C16',
          surface: '#0E2920',
          card: '#12352A',
          border: '#1A4337',
        },
        emerald: {
          DEFAULT: '#19B86A',
          bright: '#2ED47A',
          hover: '#159E5A',
          light: '#E6F8EF',
        },
        mint: {
          soft: '#DDF5E8',
          light: '#EEF9F2',
          card: '#F2FBF6',
        },
        cream: {
          DEFAULT: '#F7F6F0',
          off: '#FCFCF8',
          card: '#FFFFFF',
          border: '#EBE9DE',
        },
        charcoal: {
          DEFAULT: '#161A18',
          muted: '#2D3330',
        },
        softgray: '#747B76',
        bordergray: '#DDE5DF',
        fintech: {
          success: '#22C55E',
          warning: '#E8A317',
          error: '#D94A4A',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Manrope', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'forest': '0 20px 40px -15px rgba(9, 43, 32, 0.12)',
        'emerald-glow': '0 10px 30px -5px rgba(25, 184, 106, 0.3)',
        'card-soft': '0 4px 24px -2px rgba(16, 24, 20, 0.06)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
