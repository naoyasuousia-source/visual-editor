/**
 * 段落コマンド属性拡張
 * 新コマンドシステムで必要なカスタム属性を段落ノードに追加
 */

import { Extension } from '@tiptap/core';

export const ParagraphCommandAttributes = Extension.create({
  name: 'paragraphCommandAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          // 仮ID（INSERT_PARAGRAPH用）
          'data-temp-id': {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-temp-id'),
            renderHTML: (attributes) => {
              if (!attributes['data-temp-id']) return {};
              return { 'data-temp-id': attributes['data-temp-id'] };
            },
          },

          // コマンドタイプ（ハイライト用）
          'data-command-type': {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-command-type'),
            renderHTML: (attributes) => {
              if (!attributes['data-command-type']) return {};
              return { 'data-command-type': attributes['data-command-type'] };
            },
          },

          // コマンドID（ハイライト用）
          'data-command-id': {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-command-id'),
            renderHTML: (attributes) => {
              if (!attributes['data-command-id']) return {};
              return { 'data-command-id': attributes['data-command-id'] };
            },
          },

          // 移動元位置（MOVE_PARAGRAPH用）
          'data-move-from': {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-move-from'),
            renderHTML: (attributes) => {
              if (!attributes['data-move-from']) return {};
              return { 'data-move-from': attributes['data-move-from'] };
            },
          },

          // ブロックタイプ（p, h1, h2, h3）
          blockType: {
            default: 'p',
            keepOnSplit: true,
            parseHTML: (element) => element.getAttribute('data-block-type') || 'p',
            renderHTML: (attributes) => {
              if (!attributes.blockType || attributes.blockType === 'p') return {};
              return { 'data-block-type': attributes.blockType };
            },
          },

          // 段落下余白
          spacing: {
            default: null,
            keepOnSplit: true,
            parseHTML: (element) => {
              const attrValue = element.getAttribute('data-spacing');
              if (attrValue) return attrValue;

              // クラス名からの復元もサポート (救済措置)
              const classes = Array.from(element.classList);
              return classes.find(c => c.startsWith('inline-spacing-'))?.replace('inline-spacing-', '');
            },
            renderHTML: (attributes) => {
              if (!attributes.spacing) return {};
              return { 
                'data-spacing': attributes.spacing,
                class: `inline-spacing-${attributes.spacing}`
              };
            },
          },

          // インデントレベル（0～5）
          indent: {
            default: 0,
            keepOnSplit: true,
            parseHTML: (element) => {
              const attrValue = element.getAttribute('data-indent');
              if (attrValue) return parseInt(attrValue, 10);

              // クラス名からの復元もサポート
              const m = element.className.match(/indent-(\d+)/);
              return m ? parseInt(m[1], 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) return {};
              return { 
                'data-indent': String(attributes.indent),
                class: `indent-${attributes.indent}`
              };
            },
          },
          // 仮想プレースホルダーフラグ
          'data-virtual-placeholder': {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-virtual-placeholder'),
            renderHTML: (attributes) => {
              if (!attributes['data-virtual-placeholder']) return {};
              return { 'data-virtual-placeholder': attributes['data-virtual-placeholder'] };
            },
          },
        },
      },
    ];
  },
});
