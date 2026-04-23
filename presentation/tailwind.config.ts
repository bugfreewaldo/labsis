import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1F4E79', 50: '#EEF3F9', 100: '#D6E4F5', 200: '#B8D0E8', 700: '#173D5E' },
        panama: { green: '#16A34A', yellow: '#FACC15' }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
export default config;
