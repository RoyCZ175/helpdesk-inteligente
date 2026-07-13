import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#18181b",
          soft: "#212126",
          raised: "#2a2a30",
          border: "#34343c",
        },
        accent: {
          DEFAULT: "#f5c518",
          hover: "#ffd93d",
          muted: "#3a331a",
        },
        priority: {
          critica: "#ef4444",
          alta: "#f97316",
          media: "#eab308",
          baja: "#22c55e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
