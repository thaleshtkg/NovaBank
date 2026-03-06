import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    testTimeout: 8000,
    hookTimeout: 5000,
    reporters: ['verbose'],
    include: ['**/*.test.js'],
  },
});
