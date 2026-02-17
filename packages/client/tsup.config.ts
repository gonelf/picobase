import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // Bundle pocketbase into the output so it doesn't appear as a separate dependency
  // This prevents confusion when users see "pocketbase" during npm install
  noExternal: ['pocketbase'],
  splitting: false,
  sourcemap: true,
  treeshake: true,
})
