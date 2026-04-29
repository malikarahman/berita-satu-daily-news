import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#d21e24",
          navy: "#062569",
          gold: "#fdb447",
          goldSoft: "#fff6e6",
          redSoft: "#fdf0f1",
          navySoft: "#edf1fb"
        },
        newsroom: {
          ink: "#162033",
          muted: "#59657b",
          line: "#d8deea",
          surface: "#f5f7fb",
          white: "#ffffff",
          green: "#067647",
          amber: "#b54708",
          blue: "#175cd3"
        }
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16, 24, 40, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
