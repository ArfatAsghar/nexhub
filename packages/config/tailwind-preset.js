/**
 * NexHub shared Tailwind preset — "Obsidian Studio" design system.
 *
 * Luxury, professional dark-first aesthetic:
 * - Near-black obsidian base surfaces with ultra-thin borders
 * - Electric indigo primary accent, amber-gold highlights
 * - Three role colors retained but elevated (deeper, richer saturation)
 * - Shadow system uses colored glows instead of flat drop shadows
 * - Tight border-radius for a modern, precise feel
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
          tutor: "#F59E0B",
        },
        accent: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          glow: "#6366F130",
        },
        gold: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          glow: "#F59E0B20",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
        },
        success: "#10B981",
      },
      fontFamily: {
        display: ["var(--font-mono-display)", "JetBrains Mono", "monospace"],
        body: ["var(--font-sans-body)", "Inter", "sans-serif"],
        code: ["var(--font-mono-code)", "JetBrains Mono", "monospace"],
        mono: ["var(--font-mono-display)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
        sm: "6px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.04)",
        "card-hover": "0 8px 32px 0 rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.08)",
        overlay: "0 24px 60px 0 rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.06)",
        accent: "0 0 24px 0 rgb(99 102 241 / 0.35)",
        "accent-sm": "0 0 12px 0 rgb(99 102 241 / 0.25)",
        gold: "0 0 24px 0 rgb(245 158 11 / 0.3)",
        glow: "0 0 40px 0 rgb(99 102 241 / 0.2), 0 8px 32px 0 rgb(0 0 0 / 0.6)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px 0 rgb(99 102 241 / 0.2)" },
          "50%": { boxShadow: "0 0 40px 0 rgb(99 102 241 / 0.4)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "accent-gradient": "linear-gradient(135deg, #6366F1, #8B5CF6)",
        "gold-gradient": "linear-gradient(135deg, #F59E0B, #EF4444)",
        "role-developer": "linear-gradient(135deg, #818CF8, #6366F1)",
        "role-student": "linear-gradient(135deg, #34D399, #10B981)",
        "role-tutor": "linear-gradient(135deg, #F59E0B, #F97316)",
      },
    },
  },
  plugins: [],
};
