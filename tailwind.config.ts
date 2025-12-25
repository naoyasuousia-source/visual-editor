import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './v3-editor.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      width: {
        'a4': '210mm',
      },
      height: {
        'a4': '297mm',
      },
      screens: {
        'print': { 'raw': 'print' },
      },
    },
  },
  plugins: [],
};

export default config;
