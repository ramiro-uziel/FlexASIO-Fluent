/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}', "./node_modules/@tauri-controls/svelte/**/*.{js,svelte,ts}"],
  theme: {
    extend: {
      screens: {
        'wd': '645px',
      },
    },
  },
  plugins: [],
  darkMode: 'selector',
};