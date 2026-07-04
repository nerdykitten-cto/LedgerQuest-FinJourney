import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests live next to source; Playwright e2e stays in ./tests (excluded).
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
  },
});
