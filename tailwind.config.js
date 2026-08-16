/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep-space neutrals — near-black with a faint blue cast, not pure gray
        void: {
          950: "#07070c",
          900: "#0c0d16",
          850: "#111220",
          800: "#171829",
          700: "#20223a",
          600: "#2b2d4a",
        },
        // Single signature accent: a restrained violet-blue "nebula" tone
        nebula: {
          300: "#b3b8ff",
          400: "#8f8bff",
          500: "#6d63f2",
          600: "#5548d9",
          700: "#4137ad",
        },
        // Warm off-white for text on dark, avoids stark pure white
        starlight: {
          50: "#f6f5fb",
          100: "#e9e8f4",
          300: "#c7c6da",
          500: "#8f8ea6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(141,139,255,0.15), 0 8px 24px -8px rgba(109,99,242,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
