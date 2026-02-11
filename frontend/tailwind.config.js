/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'claude-orange': '#da7756',
        'claude-blue': '#4361ee',
        'dark-bg': '#0f0f1a',
        'dark-card': '#1a1a2e',
        'dark-border': '#2a2a4a'
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
