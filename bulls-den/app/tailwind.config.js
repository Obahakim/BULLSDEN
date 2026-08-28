/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bull: {
          50: "#fef2f2",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};
