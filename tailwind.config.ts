import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0F1218",
          800: "#181D27",
          700: "#232A38",
          600: "#323B4E",
        },
        calm: {
          500: "#5B8AA6",
          300: "#8FB4C9",
        },
        ember: {
          500: "#F5A623",
          600: "#E4572E",
          glow: "rgba(228,87,46,0.45)",
        },
        sage: {
          500: "#7FA687",
        },
        text: {
          100: "#EDEEF3",
          300: "#B6BBCB",
          500: "#7B8298",
        },
        border: "rgba(255,255,255,0.09)",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-ibm-plex-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        tamil: ["var(--font-noto-sans-tamil)", "sans-serif"],
      },
      borderRadius: {
        custom: "18px",
      },
    },
  },
  plugins: [],
};
export default config;

