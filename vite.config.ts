import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// import { analyzer } from "vite-bundle-analyzer"
import packageJson from "./package.json";

export default defineConfig(({ mode }) => {
	const isDev = mode === "development";

	return {
		plugins: [
			nodePolyfills({
				include: ["events"],
			}),
			dts({
				include: ["src"],
				rollupTypes: true,
			}),
			// analyzer(),
		],

		server: {
			port: 8080,
			open: "/demo/index.html",
		},

		build: {
			outDir: "dist",
			emptyOutDir: true,
			sourcemap: isDev,
			minify: !isDev,
			lib: {
				entry: "src/mpegts.ts",
				name: "mpegts",
				formats: ["es"],
				fileName: () => "mpegts.esm.js",
			},
		},

		define: {
			__VERSION__: JSON.stringify(packageJson.version),
		},
	};
});
