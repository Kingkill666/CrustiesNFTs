import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pizza: {
          red: "#D42B2B",
          cheese: "#F5C518",
          crust: "#C8956C",
          green: "#2D7A3A",
          dark: "#1A1A1A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
