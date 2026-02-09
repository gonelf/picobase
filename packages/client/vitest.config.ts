import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
  },
})
