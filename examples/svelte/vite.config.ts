import obsidian from "@codewithcheese/vite-plugin-obsidian";
import { defineConfig, UserConfig } from "vite";
import esbuildSvelte from "esbuild-svelte";

module.exports = defineConfig(async (): Promise<UserConfig> => {
  const { svelte } = await import("@sveltejs/vite-plugin-svelte");
  return {
    plugins: [
      svelte(),
      obsidian({
        plugins: [esbuildSvelte()],
      }),
    ],
  };
});
