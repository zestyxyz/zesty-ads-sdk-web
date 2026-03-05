import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@zestyxyz/babylonjs-sdk': path.resolve(__dirname, '../../babylonjs/src/index.js'),
      // Ensure babylonjs SDK source resolves @babylonjs/core from this project's node_modules
      '@babylonjs/core': path.resolve(__dirname, 'node_modules/@babylonjs/core'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
