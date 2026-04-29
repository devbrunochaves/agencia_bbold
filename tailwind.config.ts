import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
        gray: {
          dim: "#2A2A2A",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        body: ["var(--font-barlow)", "sans-serif"],
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
