import { useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface ImageMeta {
    src: string;
    anchor: string; // 段落ID
    title?: string;
    caption?: string;
    tags?: string;
}

/**
 * AI画像インデックス管理フック
 * 
 * V1の ai-image-index.ts の機能を再現
 * 
 * 【重要】直接DOM操作を最小限に抑え、Reactの状態管理とTiptap APIを活用
 * 
 * 【機能】
 * - 画像インデックスの自動生成・更新
 * - 画像メタデータの管理（title, caption, tags）
 * - AI用の構造化データ出力
 */
export const useImageIndex = (editor: Editor | null, isWordMode: boolean) => {
    /**
     * AI画像インデックスDOMを作成・取得
     */
    const ensureImageIndexElement = useCallback((): HTMLElement | null => {
        if (isWordMode) return null;

        let container = document.getElementById('ai-image-index');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-image-index';
            container.style.display = 'none';
            document.body.appendChild(container);
        }
        return container;
    }, [isWordMode]);

    /**
     * エディタ内の全画像からメタデータを収集
     */
    const collectImageMetas = useCallback((): ImageMeta[] => {
        if (!editor || isWordMode) return [];

        const metas: ImageMeta[] = [];
        const { doc } = editor.state;

        // Tiptap APIを使用して画像ノードを検索
        doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
                const attrs = node.attrs;
                
                // 画像の親段落IDを取得
                let anchor = '';
                doc.nodesBetween(0, pos, (parentNode) => {
                    if (parentNode.attrs.id) {
                        anchor = parentNode.attrs.id;
                    }
                });

                metas.push({
                    src: attrs.src || '',
                    anchor: anchor || '',
                    title: attrs.title || '',
                    caption: attrs.caption || '',
                    tags: attrs.tags || ''
                });
            }
        });

        return metas;
    }, [editor, isWordMode]);

    /**
     * AI画像インデックスDOMを再構築
     */
    const rebuildImageIndex = useCallback(() => {
        if (isWordMode) return;

        const container = ensureImageIndexElement();
        if (!container) return;

        const metas = collectImageMetas();
        
        // DOMを再構築
        container.innerHTML = '';
        metas.forEach(meta => {
            const metaElement = document.createElement('div');
            metaElement.className = 'figure-meta';
            metaElement.dataset.src = meta.src;
            metaElement.dataset.anchor = meta.anchor;
            metaElement.dataset.title = meta.title || '';
            metaElement.dataset.caption = meta.caption || '';
            metaElement.dataset.tag = meta.tags || '';
            container.appendChild(metaElement);
        });
    }, [isWordMode, ensureImageIndexElement, collectImageMetas]);

    /**
     * エディタの変更を監視して自動更新
     */
    useEffect(() => {
        if (!editor || isWordMode) return;

        // 初回構築
        rebuildImageIndex();

        // エディタの更新を監視
        const handleUpdate = () => {
            rebuildImageIndex();
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
        };
    }, [editor, isWordMode, rebuildImageIndex]);

    /**
     * 画像メタデータを更新
     */
    const updateImageMeta = useCallback((src: string, field: 'title' | 'caption' | 'tags', value: string) => {
        if (!editor) return;

        // Tiptapのトランザクションで画像属性を更新
        const { doc, tr } = editor.state;
        let updated = false;

        doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src === src) {
                tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    [field]: value
                });
                updated = true;
            }
        });

        if (updated) {
            editor.view.dispatch(tr);
            rebuildImageIndex();
        }
    }, [editor, rebuildImageIndex]);

    return {
        rebuildImageIndex,
        updateImageMeta,
        collectImageMetas
    };
};
