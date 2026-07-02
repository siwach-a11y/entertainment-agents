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
          // Cinematic dark palette — gold accent + dark-friendly semantics.
          blue: "#EBB454",
          "blue-light": "#2E2712",
          teal: "#EBB454",
          "teal-light": "#2E2712",
          coral: "#F2766B",
          "coral-light": "#351A18",
          amber: "#E7A93C",
          "amber-light": "#322815",
          purple: "#C69BFF",
          "purple-light": "#241A33",
          green: "#5AD07E",
          "green-light": "#12301C",
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
