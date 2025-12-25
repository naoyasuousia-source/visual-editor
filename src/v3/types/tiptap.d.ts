import { Commands } from '@tiptap/core';

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
    }
  }

  interface EditorOptions {
    paragraphNumbering?: {
      isWordMode?: boolean;
    };
  }
}
