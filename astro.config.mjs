import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://mithrilstudio.com",
  output: "static",
  trailingSlash: "always",
  vite: {
    build: {
      // Preserve the legacy CSS decimals exactly; minification shifts some
      // responsive image geometry by one browser subpixel.
      cssMinify: false,
    },
    plugins: [tailwindcss()],
  },
});
