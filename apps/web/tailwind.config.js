/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@nexhub/config/tailwind-preset.js")],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
