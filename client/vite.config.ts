import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, '../public'),
  server: {
    host: '0.0.0.0',
    port: 9401,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 9401,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
