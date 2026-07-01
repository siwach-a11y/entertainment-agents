import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hub: {
          blue: "#65A30D",
          "blue-light": "#F7FEE7",
          teal: "#4D7C0F",
          "teal-light": "#ECFCCB",
          coral: "#CA8A04",
          "coral-light": "#FEF9C3",
          amber: "#A16207",
          "amber-light": "#FEFCE8",
          purple: "#EAB308",
          "purple-light": "#FEFCE8",
          green: "#3F6212",
          "green-light": "#D9F99D",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(101, 163, 13, 0.35)",
        card: "0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
        "card-hover":
          "0 4px 12px rgba(15, 23, 42, 0.06), 0 20px 48px rgba(101, 163, 13, 0.12)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
