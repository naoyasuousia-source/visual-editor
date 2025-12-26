import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';

/**
 * Cross Page Merge Extension
 * 
 * 各ページの一段落目の先頭でBackspaceを押した場合、
 * 前のページの最終段落にマージする。
 * 
 * ページ内に段落が1つしかない場合は、ページごと削除してコンテンツを前のページへ移動する。
 */
export const CrossPageMerge = Extension.create({
    name: 'crossPageMerge',

    addKeyboardShortcuts() {
        return {
            'Backspace': ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;

                // カーソルが段落の先頭にあるかチェック
                if ($from.parentOffset !== 0) return false;

                // 現在のノードがparagraphかheadingかチェック
                const currentNode = $from.parent;
                if (currentNode.type.name !== 'paragraph' && currentNode.type.name !== 'heading') {
                    return false;
                }

                // 親ページを探す
                let pageNode = null;
                let pagePos = -1;
                let paragraphIndex = -1;
                let paragraphCount = 0;
                
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'page') {
                        pageNode = node;
                        pagePos = $from.before(d);
                        
                        // ページ内で何番目の段落かチェック
                        const posInPage = $from.pos - pagePos - 1;
                        let offset = 0;
                        node.forEach((child, childOffset, index) => {
                            if (child.type.name === 'paragraph' || child.type.name === 'heading') {
                                paragraphCount++;
                                if (offset <= posInPage && posInPage < offset + child.nodeSize) {
                                    paragraphIndex = index;
                                }
                            }
                            offset += child.nodeSize;
                        });
                        break;
                    }
                }

                if (!pageNode || pagePos === -1) return false;
                
                console.log('CrossPageMerge: page found', { paragraphIndex, paragraphCount });

                // ページの最初の段落でない場合は通常のBackspace処理
                if (paragraphIndex !== 0) return false;

                // 1ページ目の場合は処理しない（FirstParagraphProtectionに任せる）
                if (pagePos === 0) return false;

                console.log('CrossPageMerge: attempting merge');

                // 前のページを探す
                let prevPageNode = null;
                let prevPagePos = -1;
                
                state.doc.descendants((node, pos) => {
                    if (node.type.name === 'page' && pos < pagePos) {
                        prevPageNode = node;
                        prevPagePos = pos;
                    }
                    return true;
                });

                if (!prevPageNode || prevPagePos === -1) return false;

                console.log('CrossPageMerge: prev page found at pos', prevPagePos);

                // 前のページの最後の段落を見つける
                let lastParagraphNode = null;
                let lastParagraphPos = -1;
                
                prevPageNode.forEach((child, offset, index) => {
                    if (child.type.name === 'paragraph' || child.type.name === 'heading') {
                        lastParagraphNode = child;
                        lastParagraphPos = prevPagePos + 1 + offset;
                    }
                });

                if (!lastParagraphNode || lastParagraphPos === -1) return false;

                console.log('CrossPageMerge: merging into paragraph at pos', lastParagraphPos);

                // マージ操作を実行
                const { tr } = state;

                // 挿入位置（前のページの最後の段落の終端）
                const insertPos = lastParagraphPos + lastParagraphNode.nodeSize - 1;

                // 現在の段落の内容を前の段落に追加
                if (currentNode.content.size > 0) {
                    tr.insert(insertPos, currentNode.content);
                }

                if (paragraphCount === 1) {
                    // ページ内に段落が1つしかない場合は、ページごと削除
                    console.log('CrossPageMerge: deleting entire page');
                    
                    // 注意: insertによりposが変わる
                    const contentSize = currentNode.content.size;
                    const pageDeletePos = pagePos + contentSize;
                    
                    tr.delete(pageDeletePos, pageDeletePos + pageNode.nodeSize);
                } else {
                    // 他にも段落がある場合は、現在の段落のみ削除
                    console.log('CrossPageMerge: deleting paragraph only');
                    
                    const currentParagraphPos = $from.pos - $from.parentOffset - 1;
                    const shift = currentNode.content.size;
                    tr.delete(currentParagraphPos + shift, currentParagraphPos + shift + currentNode.nodeSize);
                }

                // カーソルを移動
                tr.setSelection(TextSelection.create(tr.doc, insertPos));

                editor.view.dispatch(tr);
                return true;
            },
        };
    },
});
