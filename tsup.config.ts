import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives"
import { defineConfig } from "tsup"

export default defineConfig(() => {
    return {
        entry: {
            index: "./src/index.ts"
        },
        format: ["esm", "cjs"],
        splitting: true,
        cjsInterop: true,
        skipNodeModulesBundle: true,
        treeshake: true,
        metafile: true,
        esbuildPlugins: [
            preserveDirectivesPlugin({
                directives: ["use client", "use strict"],
                include: /\.(js|ts|jsx|tsx)$/,
                exclude: /node_modules/
            })
        ]
    }
})
