/**
 * NexHub shared Tailwind preset.
 *
 * Design rationale (Phase One):
 * - Canvas is near-black, not pure black, to keep code blocks and role-color
 *   accents from fighting with the background.
 * - The three role colors (developer/student/tutor) are the product's real
 *   signature — every card gets a left border in the author's role color —
 *   so they're promoted to first-class theme colors, not buried in JS.
 * - Mono display face for headings/usernames/badges ties to the
 *   code-snippet-centric content; Inter for body keeps prose readable.
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
          developer: "#818CF8",
          student: "#34D399",
          tutor: "#FB923C",
        },
        accent: {
          DEFAULT: "#818CF8",
          hover: "#6366F1",
        },
        danger: {
          DEFAULT: "#FF5C5C",
          hover: "#FF7A7A",
        },
        success: "#34D399",
      },
      fontFamily: {
        display: ["var(--font-mono-display)", "JetBrains Mono", "monospace"],
        body: ["var(--font-sans-body)", "Inter", "sans-serif"],
        code: ["var(--font-mono-code)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "10px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.4)",
        overlay: "0 8px 30px 0 rgb(0 0 0 / 0.55)",
      },
    },
  },
  plugins: [],
};
