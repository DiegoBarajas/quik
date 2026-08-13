import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        "cron/index": "src/cron/index.ts",
        "http/index": "src/http/index.ts",
        "ws/index": "src/ws/index.ts",
        "socket.io/index": "src/socket.io/index.ts"
    },
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: "node22",
});