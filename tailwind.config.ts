import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './v2-editor.html',
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
  plugins: [
    function({ addComponents, addBase, addUtilities }) {
      addBase({
        '.ProseMirror': {
          outline: 'none',
          minHeight: '100%',
        },
        '.ProseMirror img': {
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          transition: 'all 0.3s ease',
        },
        '.ProseMirror a': {
          color: '#2563eb',
          textDecoration: 'underline',
          cursor: 'pointer',
          textDecorationColor: '#93c5fd',
          textUnderlineOffset: '2px',
        },
      });
      addComponents({
        '.page': {
          backgroundColor: 'white',
          position: 'relative',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          width: '210mm',
          minHeight: '297mm',
          pageBreakAfter: 'always',
        },
        '.page-inner': {
          position: 'relative',
          padding: 'var(--page-margin, 17mm)',
          outline: 'none',
          minHeight: '297mm',
          counterReset: 'paragraph-counter',
        },
        '.page-inner p': {
          position: 'relative',
        },
        '.page-inner p::before': {
          position: 'absolute',
          left: '5mm',
          fontSize: '10px',
          color: '#d1d5db',
          fontFamily: 'ui-monospace, monospace',
          userSelect: 'none',
          pointerEvents: 'none',
          counterIncrement: 'paragraph-counter',
          content: '"p" attr(data-page) "-" counter(paragraph-counter)',
        },
        '.mode-word .page-inner p::before': {
          content: '"p" counter(paragraph-counter)',
        },
        /* エディタロック時のポインターイベント制御 */
        '.locked-editor .ProseMirror': {
          pointerEvents: 'none',
        },
        '.locked-editor .ProseMirror [data-command-type]': {
          pointerEvents: 'auto',
          cursor: 'pointer',
        },
      });
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
