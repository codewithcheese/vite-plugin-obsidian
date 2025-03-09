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
