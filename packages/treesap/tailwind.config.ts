import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./static/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        '2/5': '40%',
      },
      zIndex: {
        '60': '60',
      }
    }
  },
  plugins: [typography()],
};

export default config;