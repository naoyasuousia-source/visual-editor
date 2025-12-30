import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './v2-editor.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
