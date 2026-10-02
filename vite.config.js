import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2022",
    rolldownOptions: {
      input: {
        main: "index.html",
        faq: "faq/index.html",
        privacy: "privacy/index.html",
        cookies: "cookies/index.html",
        terms: "terms/index.html",
        accessibility: "accessibility/index.html",
        acknowledgements: "acknowledgements/index.html",
        presentation: "presentacion/index.html",
        deliveryRegistry: "registro-entrega/index.html",
      },
    },
  },
});
