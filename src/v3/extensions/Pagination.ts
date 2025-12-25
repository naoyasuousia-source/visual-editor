import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const Pagination = Extension.create({
    name: 'pagination',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('pagination'),
                view() {
                    return {
                        update: (view) => {
                            const { state } = view;
                            // ページ溢れの検知ロジック
                            // Tiptap (ProseMirror) ではDOMの高さ測定が必要
                            const pages = document.querySelectorAll('section.page');
                            pages.forEach((page, index) => {
                                const inner = page.querySelector('.page-inner') as HTMLElement;
                                if (inner && inner.scrollHeight > inner.clientHeight + 1) {
                                    // 溢れが発生している場合の処理（Stateの更新をトリガー）
                                    // 実際の実装では、ここで Transaction を発行してコンテンツを分割する
                                }
                            });
                        },
                    };
                },
            }),
        ];
    },
});
