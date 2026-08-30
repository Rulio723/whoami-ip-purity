import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'client.js',
      formats: ['es']
    },
    outDir: 'public/assets',
    emptyOutDir: false,
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'client-[hash].js',
        chunkFileNames: '[name]-[hash].js'
      }
    }
  }
});
