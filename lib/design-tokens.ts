/**
 * CoinShares Design Tokens
 * TypeScript exports for programmatic access to design system values
 */

export const colors = {
  // Primary Blue Colors
  primary: {
    DEFAULT: "#0052FF",
    hover: "#0046DD",
    active: "#003DB8",
    electric: "#60A5FA",
    deep: "#1E3A8A",
  },

  // Semantic Colors
  success: {
    DEFAULT: "#10B981",
    bg: "rgba(16, 185, 129, 0.15)",
  },
  danger: {
    DEFAULT: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
  warning: {
    DEFAULT: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.15)",
  },
  info: {
    DEFAULT: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.15)",
  },

  // Background Colors
  background: {
    main: "#0A0A0A",
    card: "#141414",
    elevated: "#1A1A1A",
    hover: "#1E1E1E",
  },

  // Text Colors
  text: {
    primary: "#FFFFFF",
    secondary: "#A3A3A3",
    tertiary: "#737373",
    disabled: "#525252",
  },

  // Border Colors
  border: {
    DEFAULT: "#262626",
    hover: "#404040",
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
} as const;

export const borderRadius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const fontSize = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "28px",
  "4xl": "32px",
  "5xl": "36px",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.3)",
  md: "0 4px 6px rgba(0, 0, 0, 0.4)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.5)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.6)",
  glowBlue: "0 0 20px rgba(0, 82, 255, 0.3)",
  glowBlueSubtle: "0 0 20px rgba(0, 82, 255, 0.15)",
  glowBlueIntense: "0 0 30px rgba(0, 82, 255, 0.5)",
} as const;

export const transitions = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
} as const;

// Type exports for TypeScript autocomplete
export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
export type ShadowKey = keyof typeof shadows;
export type TransitionKey = keyof typeof transitions;
