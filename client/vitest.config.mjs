import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    // These are plain node scripts, not vitest suites. The root `npm test`
    // runs them through test-loader.mjs.
    exclude: [
      ...configDefaults.exclude,
      "app/uniformbuilder/modules/awardNumerals.test.js",
      "app/uniformbuilder/modules/getCanvasObject.test.js",
      "app/uniformbuilder/modules/constants/awardCatalog.test.js",
    ],
  },
});
