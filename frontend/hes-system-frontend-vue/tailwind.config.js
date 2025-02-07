/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#2196F3',
          dark: '#1976D2'
        },
        form: {
          border: '#E0E0E0',
          background: '#F5F9FF'
        }
      },
      borderRadius: {
        card: '16px',
        button: '8px'
      },
      fontSize: {
        header: '20px',
        input: '14px',
        button: '16px',
        link: '12px'
      },
      maxWidth: {
        card: '800px'
      }
    }
  },
  plugins: []
}
