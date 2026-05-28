/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 18px 60px rgba(15, 23, 42, 0.16)"
      },
      colors: {
        vzn: {
          50: "#faf8f4",
          100: "#f0ead8",
          200: "#ddd0b0",
          300: "#c4a878",
          400: "#A0845C",
          500: "#8B7355",
          600: "#6B5840",
          700: "#4A3D2C",
          800: "#2E2419",
          900: "#1a1610"
        }
      }
    }
  },
  plugins: []
};
