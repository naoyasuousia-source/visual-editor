import { defineConfig } from 'vite';
import obfuscator from 'rollup-plugin-obfuscator';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    obfuscator({
      global: true,
      options: {
        compact: true,
        controlFlowFlattening: false, // 複雑化を回避
        deadCodeInjection: false, // デッドコード注入を回避
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: false, // 数式の変換を回避
        renameGlobals: false,
        selfDefending: false, // 防御機構を解除
        simplify: true,
        splitStrings: false, // 文字列分割を解除
        stringArray: false, // 文字列配列化を解除（これがパス解決エラーの主原因になりやすい）
        transformObjectKeys: false, // オブジェクトキーの変換を解除
        unicodeEscapeSequence: false
      },
    }),
  ],
  base: './', // GitHub Pages用。リポジトリ名が決まっている場合は '/repo-name/' でも良い
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor_v2: resolve(__dirname, 'ai-link-editor.html'),
      },
    },
  },
  server: {
    port: 3000,
  }
});
