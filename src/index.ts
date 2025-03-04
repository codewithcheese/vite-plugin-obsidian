import path from "node:path";
import { cwd } from "node:process";
import merge from "lodash.merge";
import type { PluginOption, ResolvedConfig, UserConfig } from "vite";
import { createLogger } from "./logger";
import type { PluginOptions, VitePluginOptions } from "./types";
import { resolveServerUrl } from "./utils";
import esbuild, { BuildOptions } from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import copy from "esbuild-plugin-copy";
import { PLUGIN_NAME } from "./constants";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY VITE-PLUGIN-OBSIDIAN
if you want to view the source, please visit the github repository of this plugin
*/
`;

export * from "./types";

const isDev = process.env.NODE_ENV === "development";
const logger = createLogger();

function preMergeOptions(options?: VitePluginOptions): VitePluginOptions {
  const opts: VitePluginOptions = merge(
    {
      recommended: true,
      extension: {
        banner: {
          js: banner,
        },
        entryPoints: ["plugin/main.ts"],
        bundle: true,
        external: [
          "obsidian",
          "electron",
          "@codemirror/autocomplete",
          "@codemirror/collab",
          "@codemirror/commands",
          "@codemirror/language",
          "@codemirror/lint",
          "@codemirror/search",
          "@codemirror/state",
          "@codemirror/view",
          "@lezer/common",
          "@lezer/highlight",
          "@lezer/lr",
          ...builtins,
        ],
        target: "es2022",
        logLevel: "info",
        sourcemap: isDev ? "inline" : undefined,
        treeShaking: true,
        resolveExtensions: [".svelte", ".svelte.ts", ".ts", ".js"],
        tsconfig: path.resolve(process.cwd(), "tsconfig.json"),
      } satisfies PluginOptions,
    },
    options,
  );

  const opt = opts.extension || {};

  if (isDev) {
    opt.sourcemap = opt.sourcemap ?? true;
  } else {
    opt.minify ??= true;
  }

  opt.format = "cjs";

  return opts;
}

export function useObsidianPlugin(options?: VitePluginOptions): PluginOption[] {
  const opts = preMergeOptions(options);

  const handleConfig = (config: UserConfig): UserConfig => {
    let outDir = config?.build?.outDir || "dist";
    opts.extension ??= {};
    if (opts.recommended) {
      opts.extension.outdir = outDir;
    }

    const cors = {
      origin: ["app://obsidian.md"],
      credentials: true,
    };
    const port = config?.server?.port || 15173;
    const strictPort = true;

    return {
      server: {
        cors,
        port,
        strictPort,
      },
      build: {
        outDir,
        sourcemap: isDev ? true : config?.build?.sourcemap,
      },
    };
  };

  let resolvedConfig: ResolvedConfig;

  return [
    {
      name: PLUGIN_NAME,
      apply: "serve",
      config(config) {
        return handleConfig(config);
      },
      configResolved(config) {
        resolvedConfig = config;
      },
      configureServer(server) {
        if (!server || !server.httpServer) {
          return;
        }
        server.httpServer?.once("listening", async () => {
          const env = {
            NODE_ENV: server.config.mode || "development",
            VITE_DEV_SERVER_URL: resolveServerUrl(server),
          };

          logger.info("extension build start", opts);

          const { onSuccess: _onSuccess, ...esbuildOptions } =
            opts.extension || {};
          const context = await esbuild.context(
            merge(esbuildOptions, {
              // todo test env
              // env,
              plugins: [
                esbuildSvelte(),
                ...(esbuildOptions.plugins || []),
                copy({
                  assets: {
                    from: ["manifest.json"],
                    to: ["manifest.json"],
                  },
                }),
              ],
            }),
          );

          await context.watch();
        });
      },
    } satisfies PluginOption,
    {
      name: PLUGIN_NAME,
      apply: "build",
      enforce: "post",
      config(config) {
        return handleConfig(config);
      },
      configResolved(config) {
        resolvedConfig = config;
      },
      async closeBundle() {
        let outDir = resolvedConfig.build.outDir
          .replace(cwd(), "")
          .replaceAll("\\", "/");
        if (outDir.startsWith("/")) {
          outDir = outDir.substring(1);
        }
        const env = {
          NODE_ENV: resolvedConfig.mode || "production",
          VITE_WEBVIEW_DIST: outDir,
        };

        const { onSuccess: _onSuccess, ...esbuildOptions } =
          opts.extension || {};

        await esbuild.build(
          merge(esbuildOptions, {
            minify: false, // https://github.com/EMH333/esbuild-svelte/issues/272
            plugins: [
              ...(esbuildOptions.plugins || []),
              esbuildSvelte(),
              copy({
                assets: {
                  from: ["manifest.json"],
                  to: ["manifest.json"],
                },
              }),
            ],
            define: {
              "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
              "process.env.VITE_WEBVIEW_DIST": JSON.stringify(
                env.VITE_WEBVIEW_DIST,
              ),
            },
          }),
        );

        if (typeof _onSuccess === "function") {
          await _onSuccess();
        }

        logger.info("extension build success");
      },
    } satisfies PluginOption,
  ];
}

export default useObsidianPlugin;
