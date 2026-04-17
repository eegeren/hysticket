import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1F4B99",
        accent: "#1AC6FF",
        surface: "#0F172A",
      },
    },
  },
  plugins: [],
};

export default config;
