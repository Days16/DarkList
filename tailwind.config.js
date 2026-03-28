/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        base: '#0e0e0f',
        surface: '#161618',
        elevated: '#1e1e20',
        'text-primary': '#f2f2f0',
        'text-secondary': '#8a8a8a'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        card: '8px',
        input: '4px'
      },
      transitionDuration: {
        fast: '150ms'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translate(-50%, 8px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' }
        }
      },
      animation: {
        shake: 'shake 0.35s ease',
        fadeInUp: 'fadeInUp 0.2s ease'
      }
    }
  },
  plugins: []
}
