import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages用。リポジトリ名が決まっている場合は '/repo-name/' でも良い
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});
