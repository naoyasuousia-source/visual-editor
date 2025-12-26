import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * First Paragraph Protection Extension
 * 
 * 1ページ目から全ての段落が削除されることを防ぐ。
 * 
 * 【重要】
 * - マージ操作（段落2→段落1へのBackspace）は許可する
 * - 1ページ目に最低1つの段落が残ればOK
 * - idやdata-paraは変わってもよい（paragraphNumberingが再付与する）
 */
export const FirstParagraphProtection = Extension.create({
    name: 'firstParagraphProtection',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('firstParagraphProtection'),
                filterTransaction: (transaction, state) => {
                    // ドキュメント変更がなければ許可
                    if (!transaction.docChanged) return true;

                    // トランザクション適用後のドキュメントを確認
                    const newDoc = transaction.doc;
                    
                    // 1ページ目に段落が残るかチェック
                    let firstPageHasParagraph = false;
                    
                    newDoc.descendants((node) => {
                        if (firstPageHasParagraph) return false;
                        
                        // 1ページ目を探す
                        if (node.type.name === 'page') {
                            const pageNum = node.attrs['data-page'];
                            if (pageNum === '1' || pageNum === 1) {
                                // このページ内に段落があるか確認
                                node.descendants((child) => {
                                    if (child.type.name === 'paragraph' || child.type.name === 'heading') {
                                        firstPageHasParagraph = true;
                                        return false;
                                    }
                                });
                            }
                            // 1ページ目をチェックしたら終了
                            if (pageNum === '1' || pageNum === 1) return false;
                        }
                    });

                    // 1ページ目に段落が残らない場合は阻止
                    if (!firstPageHasParagraph) {
                        console.log('Cannot delete last paragraph from page 1');
                        return false;
                    }

                    return true;
                },
            }),
        ];
    },
});
