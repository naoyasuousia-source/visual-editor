import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * First Paragraph Protection Extension
 * 
 * 1ページ目から全ての段落が削除されることを防ぐ。
 * 
 * 【修正内容】
 * Attribute `data-page` に依存せず、ドキュメントの構造（最初のページ）を直接チェックするように改善。
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
                    
                    // 最初のノード（1ページ目）を取得
                    const firstPage = newDoc.firstChild;
                    if (!firstPage || firstPage.type.name !== 'page') {
                        // 1ページ目自体が存在しない、または型が異なる場合はSchemaの強制に任せる
                        return true;
                    }

                    // 1ページ目に段落（または見出し）が存在するかチェック
                    let hasBlock = false;
                    firstPage.descendants((node) => {
                        if (hasBlock) return false;
                        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                            hasBlock = true;
                            return false; 
                        }
                    });

                    // 1ページ目に一つもブロック要素がない場合は阻止（保険）
                    if (!hasBlock) {
                        return false;
                    }

                    return true;
                },
            }),
        ];
    },
});
