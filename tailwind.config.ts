import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'orchestra': {
          'dark': '#0a0a14',
          'dark-secondary': '#12121f',
          'gold': '#d4af37',
          'gold-light': '#f0d060',
          'gold-dark': '#a08020',
          'red': '#ff3344',
          'green': '#33ff66',
          'blue': '#3399ff',
          'purple': '#9966ff',
          'violin': '#9b30ff',
          'viola': '#cc6633',
          'cello': '#8b4513',
          'flute': '#87ceeb',
          'clarinet': '#ffd700',
          'trumpet': '#ff8c00',
          'horn': '#daa520',
          'trombone': '#cd853f',
          'tuba': '#8b7355',
        }
      },
      fontFamily: {
        'display': ['Fredoka', 'Cinzel', 'serif'],
        'body': ['Fredoka', 'Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'bounce-fun': 'bounce-fun 2s ease-in-out infinite',
        'float-cute': 'float-cute 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
          '100%': { textShadow: '0 0 40px rgba(212, 175, 55, 1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        'bounce-fun': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-5px) scale(1.02)' },
        },
        'float-cute': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(5deg)' },
          '75%': { transform: 'translateY(10px) rotate(-5deg)' },
        },
      },
    },
  },
  plugins: [],
}
export default config