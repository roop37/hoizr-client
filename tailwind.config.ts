import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF7",
        ink: "#0A0A0A",
        accent: "#1F62E8",
        cream: "#FFFFFF",
        border: "#E7E7E3",
        muted: "#5A5A57",
        dark: "#0A0A0A",
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
