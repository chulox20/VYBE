/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vybe: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          primary: '#7C3AED',
          primaryDark: '#5B21B6',
          primaryLight: '#8B5CF6',
          accent: '#EC4899',
          accentLight: '#F472B6',
          text: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
          success: '#22C55E',
          danger: '#EF4444',
          surface: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'vybe': '0 4px 20px -2px rgba(124, 58, 237, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'vybe-hover': '0 10px 25px -3px rgba(124, 58, 237, 0.14), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
        'vybe-glow': '0 0 25px rgba(236, 72, 153, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
