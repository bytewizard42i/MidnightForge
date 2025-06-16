import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";

// Load environment variables from encrypted secrets
const encryptedSecretsPath = path.resolve(process.cwd(), '..', '.env.secrets.enc');
const keyPath = path.resolve(process.cwd(), '..', 'key.txt');

if (existsSync(encryptedSecretsPath) && existsSync(keyPath)) {
  try {
    // Use SOPS to decrypt the secrets and load them
    process.env.SOPS_AGE_KEY_FILE = keyPath;
    
    const decryptedContent = execSync(
      `sops --decrypt --input-type dotenv --output-type dotenv "${encryptedSecretsPath}"`,
      { encoding: 'utf8', cwd: path.resolve(process.cwd(), '..') }
    );
    
    // Parse and load the decrypted environment variables
    const lines = decryptedContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match && match[1] && match[2] !== undefined) {
          const key = match[1].trim();
          const value = match[2].replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
    
    console.log('✅ Loaded encrypted secrets for webapp');
  } catch (error: any) {
    console.warn('⚠️  Failed to decrypt secrets for webapp, using default values');
    console.warn('   Error:', error.message);
  }
} else {
  console.warn('⚠️  Encrypted secrets or key file not found, using default values');
  console.warn('   Looking for:', encryptedSecretsPath);
  console.warn('   And key file:', keyPath);
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
