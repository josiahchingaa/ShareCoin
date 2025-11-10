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
        // PRIMARY GREEN COLORS (Black + Green Theme)
        primary: {
          DEFAULT: "#00FF87",
          hover: "#00E67A",
          active: "#00CC6D",
          electric: "#00FF87",
          deep: "#00994D",
        },
        // SEMANTIC COLORS
        success: {
          DEFAULT: "#00FF87",
          bg: "rgba(0, 255, 135, 0.1)",
        },
        danger: {
          DEFAULT: "#FF4444",
          bg: "rgba(255, 68, 68, 0.1)",
        },
        warning: {
          DEFAULT: "#FFB020",
          bg: "rgba(255, 176, 32, 0.1)",
        },
        info: {
          DEFAULT: "#3B82F6",
          bg: "rgba(59, 130, 246, 0.1)",
        },
        // BACKGROUND COLORS
        background: {
          main: "#0A0A0A",
          card: "#141414",
          elevated: "#1A1A1A",
          hover: "#1E1E1E",
          input: "#0F0F0F",
          // Legacy support
          primary: "#1a1a1a",
          secondary: "#2a2a2a",
          tertiary: "#0a0e27",
        },
        // TEXT COLORS
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          tertiary: "#808080",
          disabled: "#525252",
        },
        // BORDER COLORS
        border: {
          DEFAULT: "#262626",
          hover: "#00FF87",
        },
        // LEGACY ACCENT COLORS (Updated for green theme)
        accent: {
          green: "#00FF87",
          greenAlt: "#00E67A",
          red: "#FF4444",
          redAlt: "#ff6b6b",
          gold: "#d4af37",
          goldAlt: "#f59e0b",
          blue: "#3B82F6",
        },
        // New green-specific utilities
        "electric-green": "#00FF87",
        "primary-green": "#00FF87",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.2" }],
        "2xl": ["24px", { lineHeight: "1.2" }],
        "3xl": ["28px", { lineHeight: "1.2" }],
        "4xl": ["32px", { lineHeight: "1.2" }],
        "5xl": ["36px", { lineHeight: "1.2" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0, 0, 0, 0.5)",
        DEFAULT: "0 4px 6px rgba(0, 0, 0, 0.6)",
        md: "0 4px 6px rgba(0, 0, 0, 0.6)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.7)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.8)",
        "glow-green": "0 0 20px rgba(0, 255, 135, 0.3)",
        "glow-green-subtle": "0 0 20px rgba(0, 255, 135, 0.15)",
        "glow-green-intense": "0 0 30px rgba(0, 255, 135, 0.5)",
        // Legacy blue mapped to green
        "glow-blue": "0 0 20px rgba(0, 255, 135, 0.3)",
        "glow-blue-subtle": "0 0 20px rgba(0, 255, 135, 0.15)",
        "glow-blue-intense": "0 0 30px rgba(0, 255, 135, 0.5)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "300ms",
      },
      backgroundImage: {
        "gradient-green": "linear-gradient(135deg, #00FF87 0%, #00CC6D 100%)",
        "gradient-green-vertical": "linear-gradient(180deg, #00FF87 0%, #00CC6D 100%)",
        "gradient-green-horizontal": "linear-gradient(90deg, rgba(0, 255, 135, 0.15) 0%, transparent 100%)",
        // Legacy blue mapped to green
        "gradient-blue": "linear-gradient(135deg, #00FF87 0%, #00CC6D 100%)",
        "gradient-blue-vertical": "linear-gradient(180deg, #00FF87 0%, #00CC6D 100%)",
        "gradient-blue-horizontal": "linear-gradient(90deg, rgba(0, 255, 135, 0.15) 0%, transparent 100%)",
      },
    },
  },
  plugins: [],
}

export default config
