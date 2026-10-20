/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        turf: {
          950: "#020b06",
          900: "#04170d",
          850: "#072415",
          800: "#0b331e",
          700: "#10472b",
          600: "#17643e",
        },
        pitch: {
          DEFAULT: "#00ff87",
          neon: "#00ff87",
          emerald: "#10b981",
          bright: "#34d399",
          glow: "rgba(0, 255, 135, 0.4)",
        },
        navy: {
          DEFAULT: "#04170d",
          900: "#020b06",
          800: "#072415",
          700: "#0b331e",
          600: "#10472b",
        },
        electric: {
          DEFAULT: "#00ff87",
          400: "#34d399",
          600: "#059669",
        },
        gold: {
          DEFAULT: "#f59e0b",
          400: "#fbbf24",
          500: "#d97706",
        },
        ucl: {
          pitch: "#00ff87",
          dark: "#031109",
          gold: "#f0c040",
          cyan: "#38bdf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 5s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "floodlight": "floodlight 8s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          from: { textShadow: "0 0 10px rgba(0, 255, 135, 0.5)" },
          to: { textShadow: "0 0 25px rgba(0, 255, 135, 0.9), 0 0 45px rgba(16, 185, 129, 0.6)" },
        },
        floodlight: {
          "0%": { opacity: 0.6, transform: "scale(1)" },
          "100%": { opacity: 0.9, transform: "scale(1.05)" },
        },
      },
      backgroundImage: {
        "pitch-gradient": "radial-gradient(ellipse at 50% -10%, #0d3822 0%, #061f12 45%, #020b06 90%)",
        "pitch-lines": "repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.015) 0px, rgba(255, 255, 255, 0.015) 80px, transparent 80px, transparent 160px)",
        "glass": "linear-gradient(135deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02))",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        pitch: "0 0 25px rgba(0, 255, 135, 0.35)",
        glow: "0 0 30px rgba(0, 255, 135, 0.4)",
        "glow-gold": "0 0 30px rgba(245, 158, 11, 0.4)",
      },
    },
  },
  plugins: [],
};
