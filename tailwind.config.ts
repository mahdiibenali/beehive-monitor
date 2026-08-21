import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Purple — secondary buttons, form focus, chips
        primary: {
          50: "#F4F2FF",
          100: "#E8E5FF",
          200: "#D1CCFF",
          300: "#B3ABFF",
          400: "#8E83FF",
          500: "#6C5CE7",
          600: "#5A48D6",
          700: "#4A3AB8",
          800: "#3A2D90",
          900: "#2B2270",
        },
        // Brand — calibrated to Figma swatches
        brand: {
          orange: "#E89441",
          "orange-hover": "#E8B270",
          "orange-pressed": "#B47025",
          "orange-disabled": "#D8DBE0",
          purple: "#5D4FEC",
          "purple-hover": "#8B7FED",
          "purple-pressed": "#4332CA",
          "purple-disabled": "#D8DBE0",
          "disabled-text": "#9CA3AF",
        },
        accent: {
          50: "#FFF6EC",
          100: "#FFE6CC",
          500: "#F39C12",
          600: "#D98208",
        },
        // Pink scale — used by the female gender card so it doesn't share
        // the brand's primary/purple selection color. Mirrors the same
        // 50 / 100 / 500 / 600 shape as `accent`.
        pink: {
          50: "#FCE7F3",
          100: "#FBCFE8",
          500: "#EC4899",
          600: "#DB2777",
        },
        // Landing-page palette (Figma "Dark-Blue / Blue" chips).
        // Used by the "L'allié des abeilles" section. Calibrate the hex
        // values to your Figma swatches if they differ.
        "dark-blue": {
          300: "#7F88BF",
          400: "#2D3358",
        },
        blue: {
          50: "#F5F7FE",
          100: "#E1E5FB",
          200: "#9AA5E8",
          400: "#5D6EE3",
        },
        // Landing marquee tag chip (Figma: fill #D5D9F7 @ 18%).
        "landing-tag": "#D5D9F7",
        // Landing footer band (Figma footer frame).
        "landing-footer": "#8A94E5",
        info: "#3B82F6",
        success: "#10B981",
        warning: "#F39C12",
        danger: "#EF4444",
        // App background (sidebar + page canvas). Distinct from `ink-50`
        // which stays a cool neutral reused as a subtle tint inside tables,
        // inputs, drawers, etc.
        surface: "#F8F7F5",
        ink: {
          900: "#111827",
          800: "#1F2937",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
          50: "#F9FAFB",
        },
      },
      fontFamily: {
        sans: ["var(--font-metropolis)", "Metropolis", "system-ui", "sans-serif"],
        display: [
          "var(--font-poppins)",
          "Poppins",
          "var(--font-metropolis)",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        h1: ["40px", { lineHeight: "40px", fontWeight: "600" }],
        h2: ["36px", { lineHeight: "38px", fontWeight: "600" }],
        h3: ["36px", { lineHeight: "38px", fontWeight: "600" }],
        link: ["18px", { lineHeight: "26px", fontWeight: "500" }],
        pb: ["16px", { lineHeight: "20px" }],
        sb: ["14px", { lineHeight: "18px" }],
        bd: ["12px", { lineHeight: "16px" }],
      },
      borderRadius: {
        field: "12px",
        card: "14px",
        pill: "9999px",
        squircle: "30%",
      },
      boxShadow: {
        field: "0 1px 2px rgba(17, 24, 39, 0.04)",
        card: "0 4px 16px rgba(17, 24, 39, 0.06)",
        pop: "0 8px 24px rgba(17, 24, 39, 0.08)",
        focus: "0 0 0 4px rgba(108, 92, 231, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
