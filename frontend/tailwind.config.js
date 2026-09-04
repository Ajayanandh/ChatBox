/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          sidebar: {
            light: '#f9f9f9',
            dark: '#171717',
          },
          main: {
            light: '#ffffff',
            dark: '#212121',
          },
          card: {
            light: '#f4f4f4',
            dark: '#2f2f2f',
          },
          border: {
            light: '#e5e5e5',
            dark: '#383838',
          },
          input: {
            light: '#f4f4f4',
            dark: '#2f2f2f',
          },
          userBubble: {
            light: '#f4f4f4',
            dark: '#303030',
          },
          aiBubble: {
            light: 'transparent',
            dark: 'transparent',
          },
          accent: {
            DEFAULT: '#10a37f',
            hover: '#1a7f64',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
