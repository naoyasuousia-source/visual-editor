import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * First Paragraph Protection Extension
 * 
 * 1ページ目の段落番号1（最初の段落）をBackspaceで削除できないようにする。
 * 
 * 【重要】data-para="1"だけでなく、1ページ目（data-page="1"）かつ段落番号1の
 * 段落のみを保護する。
 */
export const FirstParagraphProtection = Extension.create({
    name: 'firstParagraphProtection',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('firstParagraphProtection'),
                filterTransaction: (transaction, state) => {
                    // Backspace/Delete操作のみチェック
                    if (!transaction.docChanged) return true;

                    // 1ページ目の段落番号1を探す
                    let firstParagraphPos = -1;
                    let firstParagraphNode: any = null;
                    let currentPageNumber = 0;
                    
                    state.doc.descendants((node, pos) => {
                        // すでに見つかった場合は終了
                        if (firstParagraphPos !== -1) return false;
                        
                        // ページノードを検出してページ番号を追跡
                        if (node.type.name === 'page') {
                            const pageNum = node.attrs['data-page'];
                            currentPageNumber = parseInt(pageNum, 10) || 0;
                            return true; // 子ノードを探索
                        }
                        
                        // 1ページ目の段落のみをチェック
                        if (currentPageNumber === 1) {
                            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                                // id="p1-1" の段落を保護（1ページ目の段落番号1）
                                if (node.attrs.id === 'p1-1') {
                                    firstParagraphPos = pos;
                                    firstParagraphNode = node;
                                    return false;
                                }
                            }
                        }
                    });

                    if (firstParagraphPos === -1 || !firstParagraphNode) return true;

                    // 削除操作をチェック
                    const steps = transaction.steps;
                    for (const step of steps) {
                        const stepJSON = step.toJSON();
                        
                        // ReplaceStep（削除・置換）をチェック
                        if (stepJSON.stepType === 'replace') {
                            const from = stepJSON.from;
                            const to = stepJSON.to;
                            
                            // 最初の段落が削除範囲に含まれるかチェック
                            const firstParagraphEnd = firstParagraphPos + firstParagraphNode.nodeSize;
                            
                            // 最初の段落が完全に削除される場合は阻止
                            if (from <= firstParagraphPos && to >= firstParagraphEnd) {
                                console.log('First paragraph (p1-1) deletion blocked');
                                return false;
                            }
                        }
                    }

                    return true;
                },
            }),
        ];
    },
});
