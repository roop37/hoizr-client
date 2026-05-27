import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Aligned with the marketing palette: warm-cream canvas,
        // vibrant deep green primary, neon chartreuse highlight.
        background: "#F4EFE3",
        ink: "#0A0A0A",
        accent: "#0F8842",     // vibrant deep green — primary
        accentDeep: "#0B6B33", // hover state
        cream: "#FFFFFF",      // panels stay white for contrast
        border: "#E5DFCF",
        muted: "#5A554A",
        dark: "#0A0A0A",
        acid: "#D6FF3F",       // neon chartreuse for highlight pops
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
