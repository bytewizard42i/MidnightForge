import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

// Load environment variables from encrypted secrets
const secretsPath = path.resolve(process.cwd(), '..', '.env.secrets');
if (existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
  console.log('✅ Loaded encrypted secrets for webapp');
} else {
  console.warn('⚠️  Encrypted secrets not found, using default values');
  console.warn('   Run: npm run secrets:setup');
}

// https://vite.dev/config/
export default defineConfig({
    server: {
        host: true, // Listen on all addresses for Docker
        port: 5173,
        strictPort: true,
    },
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
        'import.meta.env.VITE_NETWORK_ID': JSON.stringify(process.env.VITE_NETWORK_ID || 'TestNet'),
        'import.meta.env.VITE_LOGGING_LEVEL': JSON.stringify(process.env.VITE_LOGGING_LEVEL || 'info'),
        'import.meta.env.VITE_PINATA_API_KEY': JSON.stringify(process.env.VITE_PINATA_API_KEY || ''),
        'import.meta.env.VITE_PINATA_SECRET_API_KEY': JSON.stringify(process.env.VITE_PINATA_SECRET_API_KEY || ''),
        global: 'globalThis'
    },
});
