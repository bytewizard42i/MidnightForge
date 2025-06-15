import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000, // 2 minutes for blockchain operations
    hookTimeout: 120000, // 2 minutes for setup/teardown
  },
}); 