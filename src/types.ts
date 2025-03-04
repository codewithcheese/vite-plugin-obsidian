import type { BuildOptions } from "esbuild";

export interface PluginOptions
  extends Omit<
    BuildOptions,
    "entry" | "outdir" | "watch" | "onSuccess" | "skipNodeModulesBundle"
  > {
  format?;
  outdir?: string;
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
}

export interface VitePluginOptions {
  recommended?: boolean;
  extension?: PluginOptions;
}
