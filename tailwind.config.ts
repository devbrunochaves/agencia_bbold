import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          DEFAULT: "#F5C518",
          dark: "#D4AA10",
        },
        black: {
          DEFAULT: "#0A0A0A",
          mid: "#141414",
          light: "#1E1E1E",
        },
        offwhite: "#F0EFE8",
        cream: "#f7f0e5",
        gray: {
          dim: "#2A2A2A",
        },
        // BBOLD Flow — internal system palette. Kept separate from the
        // institutional site tokens above so the two products never bleed
        // into each other.
        flow: {
          bg: "#0B0B0C",
          surface: "#111214",
          "surface-hover": "#17181B",
          panel: "#111214",
          "panel-alt": "#161719",
          border: "#232427",
          "border-strong": "#33353A",
          yellow: "#FFD400",
          "yellow-dark": "#E0B900",
          success: "#22C55E",
          danger: "#EF4444",
          warning: "#FFD400",
          info: "#3B82F6",
          waiting: "#A855F7",
          "text-primary": "#F5F5F5",
          "text-secondary": "#C7C8CC",
          "text-muted": "#9A9CA3",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        body: ["var(--font-barlow)", "sans-serif"],
      },
      maxWidth: {
        site: "1200px",
        flow: "1600px",
      },
      boxShadow: {
        flow: "0 1px 2px rgba(0,0,0,0.4)",
        "flow-lg": "0 20px 40px rgba(0,0,0,0.55)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
