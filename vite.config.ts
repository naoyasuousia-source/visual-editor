import { defineConfig } from 'vite';
// import obfuscator from 'rollup-plugin-obfuscator';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    /* command === 'build' ? obfuscator({
      global: true,
      options: {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: false,
        stringArray: false,
        transformObjectKeys: false,
        unicodeEscapeSequence: false
      },
    }) : null, */
  ],
  base: './', // GitHub Pages用。リポジトリ名が決まっている場合は '/repo-name/' でも良い
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor_v3: resolve(__dirname, 'v3-editor.html'),
      },
    },
  },
  server: {
    port: 3000,
  }
}));
