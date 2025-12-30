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
        /* コマンドハイライトスタイル - editor.cssから移行 */
        /* REPLACE_PARAGRAPH - 青色ハイライト */
        '.page-inner p[data-command-type="replace"], .page-inner h1[data-command-type="replace"], .page-inner h2[data-command-type="replace"], .page-inner h3[data-command-type="replace"]': {
          backgroundColor: 'rgba(59, 130, 246, 0.2) !important',
          borderLeft: '4px solid #3b82f6 !important',
          paddingLeft: '8px !important',
          transition: 'background-color 0.3s, border-color 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="replace"]:hover, .page-inner h1[data-command-type="replace"]:hover, .page-inner h2[data-command-type="replace"]:hover, .page-inner h3[data-command-type="replace"]:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.3) !important',
        },
        /* INSERT_PARAGRAPH - 緑色ハイライト */
        '.page-inner p[data-command-type="insert"], .page-inner h1[data-command-type="insert"], .page-inner h2[data-command-type="insert"], .page-inner h3[data-command-type="insert"]': {
          backgroundColor: 'rgba(34, 197, 94, 0.2) !important',
          borderLeft: '4px solid #22c55e !important',
          paddingLeft: '8px !important',
          transition: 'background-color 0.3s, border-color 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="insert"]:hover, .page-inner h1[data-command-type="insert"]:hover, .page-inner h2[data-command-type="insert"]:hover, .page-inner h3[data-command-type="insert"]:hover': {
          backgroundColor: 'rgba(34, 197, 94, 0.3) !important',
        },
        /* DELETE_PARAGRAPH - 赤色ハイライト + 薄く表示 */
        '.page-inner p[data-command-type="delete"], .page-inner h1[data-command-type="delete"], .page-inner h2[data-command-type="delete"], .page-inner h3[data-command-type="delete"]': {
          backgroundColor: 'rgba(239, 68, 68, 0.2) !important',
          borderLeft: '4px solid #ef4444 !important',
          paddingLeft: '8px !important',
          opacity: '0.5 !important',
          textDecoration: 'line-through',
          transition: 'background-color 0.3s, border-color 0.3s, opacity 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="delete"]:hover, .page-inner h1[data-command-type="delete"]:hover, .page-inner h2[data-command-type="delete"]:hover, .page-inner h3[data-command-type="delete"]:hover': {
          backgroundColor: 'rgba(239, 68, 68, 0.3) !important',
          opacity: '0.7 !important',
        },
        /* MOVE_PARAGRAPH - 紫色ハイライト */
        '.page-inner p[data-command-type="move"], .page-inner h1[data-command-type="move"], .page-inner h2[data-command-type="move"], .page-inner h3[data-command-type="move"]': {
          backgroundColor: 'rgba(168, 85, 247, 0.2) !important',
          borderLeft: '4px solid #a855f7 !important',
          paddingLeft: '8px !important',
          transition: 'background-color 0.3s, border-color 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="move"]:hover, .page-inner h1[data-command-type="move"]:hover, .page-inner h2[data-command-type="move"]:hover, .page-inner h3[data-command-type="move"]:hover': {
          backgroundColor: 'rgba(168, 85, 247, 0.3) !important',
        },
        /* SPLIT_PARAGRAPH - オレンジ色ハイライト */
        '.page-inner p[data-command-type="split"], .page-inner h1[data-command-type="split"], .page-inner h2[data-command-type="split"], .page-inner h3[data-command-type="split"]': {
          backgroundColor: 'rgba(249, 115, 22, 0.2) !important',
          borderLeft: '4px solid #f97316 !important',
          paddingLeft: '8px !important',
          transition: 'background-color 0.3s, border-color 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="split"]:hover, .page-inner h1[data-command-type="split"]:hover, .page-inner h2[data-command-type="split"]:hover, .page-inner h3[data-command-type="split"]:hover': {
          backgroundColor: 'rgba(249, 115, 22, 0.3) !important',
        },
        /* MERGE_PARAGRAPH - 青緑色ハイライト */
        '.page-inner p[data-command-type="merge"], .page-inner h1[data-command-type="merge"], .page-inner h2[data-command-type="merge"], .page-inner h3[data-command-type="merge"]': {
          backgroundColor: 'rgba(20, 184, 166, 0.2) !important',
          borderLeft: '4px solid #14b8a6 !important',
          paddingLeft: '8px !important',
          transition: 'background-color 0.3s, border-color 0.3s',
          cursor: 'pointer',
        },
        '.page-inner p[data-command-type="merge"]:hover, .page-inner h1[data-command-type="merge"]:hover, .page-inner h2[data-command-type="merge"]:hover, .page-inner h3[data-command-type="merge"]:hover': {
          backgroundColor: 'rgba(20, 184, 166, 0.3) !important',
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
