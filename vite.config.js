import { defineConfig } from "vite";
import path from "path";
import packageJson from "./package.json";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// import { analyzer } from "vite-bundle-analyzer";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    root: "./demo",

    plugins: [
      nodePolyfills({
        include: ["events"],
      }),
      // analyzer(),
    ],

    // Development server config
    server: {
      port: 8080,
      open: true,
    },

    // Build config for library
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      sourcemap: isDev,
      minify: !isDev,
      lib: {
        entry: path.resolve(__dirname, "src/mpegts.js"),
        name: "mpegts",
        formats: ["es"],
        fileName: () => "mpegts.esm.js",
      },
    },

    // Define global constants
    define: {
      __VERSION__: JSON.stringify(packageJson.version),
    },

    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
    },
  };
});
