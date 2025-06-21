/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': 'var(--primary-blue)',
        'secondary-blue': 'var(--secondary-blue)',
        'pale-blue': 'var(--pale-blue)',
        'lavender': 'var(--lavender)',
        'accent-pink': 'var(--accent-pink)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
} 