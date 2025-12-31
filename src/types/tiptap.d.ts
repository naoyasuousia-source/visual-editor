import { Commands, EditorView } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * Set the font family
       */
      setFontFamily: (fontFamily: string) => ReturnType,
      /**
       * Unset the font family
       */
      unsetFontFamily: () => ReturnType,
    },
    color: {
      /**
       * Set the text color
       */
      setColor: (color: string) => ReturnType,
      /**
       * Unset the text color
       */
      unsetColor: () => ReturnType,
    },
    bookmark: {
      /**
       * Set bookmark with custom ID
       */
      setBookmark: (bookmarkId: string) => ReturnType,
    }
  }

  interface EditorOptions {
    paragraphNumbering?: {
      isWordMode?: boolean;
    };
  }
}

/**
 * Tiptap EditorPropsのハンドラ型定義
 */
export type TiptapKeyDownHandler = (view: EditorView, event: KeyboardEvent) => boolean;
export type TiptapPasteHandler = (view: EditorView, event: ClipboardEvent) => boolean;
