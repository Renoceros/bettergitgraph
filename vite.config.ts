import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'main.js',
        assetFileNames: 'main.css',
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/webview'),
    },
  },
});
