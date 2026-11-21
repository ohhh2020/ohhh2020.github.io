/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Noto Sans SC'", "'PingFang SC'", "'Microsoft YaHei UI'", "Roboto", "sans-serif", ...defaultTheme.fontFamily.sans],
        serif: ["'Newsreader'", "'Noto Serif SC'", "Georgia", "serif", ...defaultTheme.fontFamily.serif],
        mono: ["'JetBrains Mono'", "'JetBrains Mono Variable'", "'Google Sans Mono'", "Consolas", "monospace", ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
