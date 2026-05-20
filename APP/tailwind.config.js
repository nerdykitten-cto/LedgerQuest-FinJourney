/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#0b1326",
        "surface-dim": "#0b1326",
        "surface-bright": "#31394e",
        "surface-container": "#171f33",
        "surface-container-low": "#131b2e",
        "surface-container-high": "#222a3e",
        "surface-container-highest": "#2d3449",
        "on-surface": "#dbe2fd",
        "on-surface-variant": "#cfc6ae",
        "outline": "#98907a",
        "outline-variant": "#4c4634",
        "primary": "#ffeebb",
        "on-primary": "#3b2f00",
        "primary-container": "#f4d03f",
        "on-primary-container": "#6c5900",
        "secondary": "#ffb4aa",
        "on-secondary": "#640b09",
        "secondary-container": "#84231d",
        "on-secondary-container": "#ff9a8e",
        "tertiary": "#e1f0ff",
        "on-tertiary": "#00344e",
        "tertiary-container": "#a6d8ff",
        "on-tertiary-container": "#00608b",
        "error": "#ffb4ab",
        "on-error": "#690005",
      },
      fontFamily: {
        'headline': ['"Bricolage Grotesque"', 'sans-serif'],
        'body': ['"Be Vietnam Pro"', 'sans-serif'],
        'label': ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'jiggle': 'jiggle 0.3s ease-in-out infinite',
      },
      keyframes: {
        jiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        }
      }
    },
  },
  plugins: [],
}
