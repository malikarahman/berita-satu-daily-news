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
        newsroom: {
          ink: "#14171f",
          muted: "#667085",
          line: "#d9dee8",
          surface: "#f7f8fa",
          red: "#b42318",
          amber: "#b54708",
          green: "#067647",
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
