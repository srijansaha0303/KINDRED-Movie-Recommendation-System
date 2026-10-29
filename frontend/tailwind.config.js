/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1115",
        surface: "#1A1D23",
        surfaceRaised: "#22262E",
        parchment: "#EDEAE3",
        muted: "#8B8F98",
        gold: "#D4A048",
        goldDim: "#8C6E38",
        teal: "#4F7472",
        rule: "#2C3038",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "70ch",
      },
    },
  },
  plugins: [],
};
