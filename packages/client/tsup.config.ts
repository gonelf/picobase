import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  esbuildOptions(options) {
    // Resolve 'pocketbase' imports to our vendored copy
    options.alias = {
      pocketbase: path.resolve(__dirname, 'vendor/pocketbase/index.mjs'),
    }
  },
})
