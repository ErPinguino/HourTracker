/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-color)',
        card: 'var(--card-bg)',
        border: 'var(--border-color)',
        main: 'var(--text-main)',
        sec: 'var(--text-sec)',
        ter: 'var(--text-ter)',
        accent: 'var(--accent)',
      }
    },
  },
  plugins: [],
}
