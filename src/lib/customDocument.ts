import { Node } from '@tiptap/core';

/**
 * Custom Document Extension
 * 
 * ドキュメントのトップレベル構造を定義
 * 通常のTiptapは `doc > block+` だが、
 * ページベースエディタでは `doc > page+` にする必要がある
 */
export const CustomDocument = Node.create({
    name: 'doc',
    topNode: true,
    content: 'page+', // ドキュメントはページのみを含む
});
