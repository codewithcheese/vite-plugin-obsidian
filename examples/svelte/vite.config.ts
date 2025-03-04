import obsidian from "@codewithcheese/vite-plugin-obsidian";
import { defineConfig, UserConfig } from "vite";

module.exports = defineConfig(async (env): Promise<UserConfig> => {
  const { svelte } = await import("@sveltejs/vite-plugin-svelte");
  return {
    plugins: [svelte(), obsidian()],
  };
});
