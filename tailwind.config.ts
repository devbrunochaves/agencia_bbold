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
        // into each other. Light/off-white theme (V1 official) — warm
        // off-white background, warm white surfaces, near-black text,
        // BBOLD yellow reserved for accents rather than a page-wide base.
        flow: {
          bg: "#F7F6F1",
          surface: "#FFFFFF",
          "surface-hover": "#F1EFE7",
          panel: "#FFFFFF",
          "panel-alt": "#F5F3EC",
          border: "#E7E4DA",
          "border-strong": "#D6D2C4",
          yellow: "#FFD400",
          "yellow-dark": "#E0B900",
          // Text/icon-safe accent — same brand hue as `yellow`, darkened to
          // pass contrast as running text/small icons on the light surfaces
          // above (raw #FFD400 text on off-white fails WCAG AA).
          "yellow-ink": "#8A6D00",
          success: "#16A34A",
          danger: "#DC2626",
          warning: "#D97706",
          info: "#2563EB",
          waiting: "#9333EA",
          "text-primary": "#1C1A16",
          "text-secondary": "#57534A",
          "text-muted": "#8A8578",
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
        flow: "0 1px 2px rgba(28,26,22,0.05)",
        "flow-lg": "0 12px 32px rgba(28,26,22,0.10)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
