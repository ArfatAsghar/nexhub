/**
 * NexHub shared Tailwind preset — "Classic Minimal" design system.
 *
 * Minimalist, professional high-contrast dark-first aesthetic:
 * - Pure zinc/slate scale base surfaces with crisp 1px borders
 * - Crisp white accent for primary actions, dark zinc for secondary
 * - Role colors are desaturated, clean slate tones (no glows or gradients)
 * - Standard, sharp borders instead of glow shadows
 * - Consistent border-radius (8px) for a precise, structured UI
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--canvas-color)",
          raised: "var(--canvas-raised-color)",
          overlay: "var(--canvas-overlay-color)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          subtle: "var(--border-subtle-color)",
        },
        ink: {
          DEFAULT: "var(--ink-color)",
          muted: "var(--ink-muted-color)",
          faint: "var(--ink-faint-color)",
        },
        role: {
          developer: "#94A3B8", // Cool slate
          student: "#A1A1AA",   // Muted zinc
          tutor: "#D4D4D8",     // Light grey
        },
        accent: {
          DEFAULT: "#FFFFFF",
          hover: "#E4E4E7",
        },
        danger: {
          DEFAULT: "#E11D48",
          hover: "#BE123C",
        },
        success: "#10B981",
      },
      fontFamily: {
        display: ["var(--font-sans-body)", "Inter", "sans-serif"],
        body: ["var(--font-sans-body)", "Inter", "sans-serif"],
        code: ["var(--font-mono-code)", "JetBrains Mono", "monospace"],
        mono: ["var(--font-mono-code)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "8px",
        pill: "999px",
        sm: "4px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        overlay: "0 12px 30px 0 rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
