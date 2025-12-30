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
            default: 'none',
            keepOnSplit: true,
            parseHTML: (element) => element.getAttribute('data-spacing') || 'none',
            renderHTML: (attributes) => {
              if (!attributes.spacing || attributes.spacing === 'none') return {};
              return { 'data-spacing': attributes.spacing };
            },
          },

          // インデントレベル（0～4）
          indent: {
            default: 0,
            keepOnSplit: true,
            parseHTML: (element) => {
              const value = element.getAttribute('data-indent');
              return value ? parseInt(value, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) return {};
              return { 'data-indent': String(attributes.indent) };
            },
          },
        },
      },
    ];
  },
});
