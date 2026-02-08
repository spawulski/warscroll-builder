import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    { pattern: /^bg-(slate-500|blue-600|green-600|orange-500|yellow-600|red-600|purple-600|black)$/ },
  ],
  theme: {
    extend: {
      colors: {
        // AoS phase colors for abilities
        "aos-yellow": "#f5c542",
        "aos-blue": "#3b82f6",
        "aos-green": "#22c55e",
        "aos-orange": "#f97316",
        "aos-red": "#dc2626",
        "aos-purple": "#9333ea",
        "aos-grey": "#6b7280",
        "aos-black": "#1f2937",
        "ward-red": "#b91c1c",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
