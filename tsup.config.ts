import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig(() => {
  return [
    {
      entry: ["src/index.ts"],
      format: ["esm", "cjs"],
      target: ["es2021", "node16"],
      external: ["vite", "esbuild"].concat(Object.keys(pkg.dependencies || {})),
      shims: true,
      clean: false,
      dts: true,
      splitting: true,
      sourcemap: true,
    },
    // {
    //   entry: ["src/webview/webview.ts"],
    //   format: ["esm", "cjs"],
    //   target: ["es2020", "node14"],
    //   shims: true,
    //   clean: false,
    //   dts: true,
    //   splitting: true,
    //   loader: {
    //     ".html": "text",
    //   },
    // },
    // {
    //   entry: ["src/webview/client.ts"],
    //   format: ["iife"],
    //   target: ["chrome89"],
    //   platform: "browser",
    //   clean: false,
    //   dts: false,
    // },
  ];
});
