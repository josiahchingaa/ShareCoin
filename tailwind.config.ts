import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CoinShares-inspired dark theme
        background: {
          primary: "#1a1a1a",
          secondary: "#2a2a2a",
          tertiary: "#0a0e27",
        },
        text: {
          primary: "#f5f5f5",
          secondary: "#a0a0a0",
        },
        accent: {
          green: "#00d4aa",
          greenAlt: "#22c55e",
          red: "#ef4444",
          redAlt: "#ff6b6b",
          gold: "#d4af37",
          goldAlt: "#f59e0b",
        },
        border: {
          DEFAULT: "#3a3a3a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
      },
    },
  },
  plugins: [],
}

export default config
