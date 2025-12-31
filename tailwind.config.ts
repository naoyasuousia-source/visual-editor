import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // デザイントークン: A4サイズ定数
      width: {
        'a4': '210mm',
      },
      height: {
        'a4': '297mm',
      },
      // デザイントークン: ページマージン
      spacing: {
        'page-margin': 'var(--page-margin, 17mm)',
      },
      // デザイントークン: パラグラフ番号の位置
      inset: {
        'para-number': '5mm',
      },
    },
  },
  plugins: [
    // scrollbar-hideユーティリティ
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};

export default config;
