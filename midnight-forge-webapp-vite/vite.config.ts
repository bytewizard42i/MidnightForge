import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
      react(),
      viteCommonjs({ // Move viteCommonjs here, before wasm and topLevelAwait
          include: [
            "**/node_modules/**",
            "**/node_modules/@midnight-ntwrk/midnight-js-indexer-public-data-provider/**"
          ],
      }),
      wasm(),
      topLevelAwait(),
    ],
    optimizeDeps: {
        include: [
            '@midnight-ntwrk/dapp-connector-api',
            '@midnight-ntwrk/midnight-js-fetch-zk-config-provider',
            '@midnight-ntwrk/midnight-js-level-private-state-provider',
            '@midnight-ntwrk/midnight-js-contracts',
            '@midnight-ntwrk/compact-runtime',
        ],
        exclude: [
          '@midnight-ntwrk/onchain-runtime',
          
          ],
        esbuildOptions: {
            target: "esnext",
            format: "esm",
            supported: {
                "top-level-await": true,
            },
        },
    },
    worker: {
        format: "es",
        plugins: () => [wasm(), topLevelAwait()],
    },
    define: {
        'import.meta.env.VITE_NETWORK_ID': '"TestNet"',
        'import.meta.env.VITE_LOGGING_LEVEL': '"info"',
        global: 'globalThis'
    },
});
