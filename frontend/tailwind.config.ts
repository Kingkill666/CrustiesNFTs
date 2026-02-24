import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "orange-primary": "#E85D04",
        "orange-dark": "#C44900",
        "orange-light": "#FFF3E0",
        cream: "#FFFDF7",
        "crust-brown": "#8B5E3C",
        "cheese-yellow": "#FFD166",
        "tomato-red": "#E63946",
        "basil-green": "#2D6A4F",
        charcoal: "#1D1D1D",
        "muted-text": "#6B7280",
      },
      fontFamily: {
        display: ["Luckiest Guy", "cursive"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(10deg)" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 20s linear infinite",
        float: "float 3s ease-in-out infinite",
        confetti: "confetti 2.5s linear forwards",
      },
    },
  },
  plugins: [],
};

export default config;
