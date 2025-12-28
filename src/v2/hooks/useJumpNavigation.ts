import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { clearSearchHighlights, countSearchMatches, highlightSearchMatches } from '@/utils/searchHighlight';

/**
 * ジャンプ機能のロジックを管理するカスタムフック
 * 段落IDまたはテキスト検索によるナビゲーション機能を提供
 * v1のnavigator.ts jumpToParagraph関数を参考に実装
 */
export const useJumpNavigation = (editor: Editor | null, isWordMode: boolean) => {
    const jumpTo = (target: string) => {
        if (!editor || !target) return;

        // 常に前回の検索ハイライトをクリア
        clearSearchHighlights();

        let targetId = target;
        
        // ID形式の自動変換
        if (!isWordMode && /^\d+-\d+$/.test(target)) {
            targetId = 'p' + target;
        } else if (isWordMode && /^\d+$/.test(target)) {
            targetId = 'p' + target;
        }

        // Tiptapのドキュメントツリーを走査してターゲットを検索
        let found = false;
        let targetPos = -1;

        editor.state.doc.descendants((node, pos) => {
            if (found) return false;
            
            // 段落ノードのID属性をチェック
            if ((node.type.name === 'paragraph' || node.type.name === 'heading') && 
                node.attrs.id === targetId) {
                targetPos = pos;
                found = true;
                return false;
            }
            
            // data-para属性もチェック
            if (node.attrs['data-para'] === target || node.attrs['data-para'] === targetId) {
                targetPos = pos;
                found = true;
                return false;
            }
        });

        if (found && targetPos !== -1) {
            // 段落IDが見つかった場合
            editor.commands.focus();
            editor.commands.setTextSelection(targetPos);
            
            // エディタのビューを使用してスクロール（確実に中央配置）
            const { view } = editor;
            const domAtPos = view.domAtPos(targetPos);
            
            // 段落要素を確実に取得
            let targetElement: Element | null = null;
            if (domAtPos.node.nodeType === Node.ELEMENT_NODE) {
                targetElement = domAtPos.node as Element;
            } else if (domAtPos.node.parentElement) {
                targetElement = domAtPos.node.parentElement;
            }

            // p要素またはh要素まで遡る
            if (targetElement) {
                const paragraphOrHeading = targetElement.closest('p, h1, h2, h3, h4, h5, h6');
                if (paragraphOrHeading) {
                    // 少し遅延させて確実にスクロール（レンダリング後）
                    setTimeout(() => {
                        paragraphOrHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                } else {
                    // フォールバック
                    setTimeout(() => {
                        targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }
            }
            
            toast.success(`${target} へジャンプしました`);
            return;
        }

        // 段落IDが見つからない場合、テキスト検索フォールバック（v1準拠）
        const editorElement = editor.view.dom;
        
        // Tiptapエディタ内のすべての段落要素を検索対象に
        const searchContainers = [editorElement];

        const count = countSearchMatches(target, searchContainers as Element[]);

        if (count === 0) {
            toast.error(`指定された段落または文字列が見つかりません: ${target}`);
        } else if (count > 1) {
            toast.error(`該当箇所が複数あります（${count}箇所）。検索条件を詳しくしてください。`);
        } else {
            // 正確に1件のマッチ
            const firstMatch = highlightSearchMatches(target, searchContainers as Element[]);

            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                toast.success(`"${target}" が見つかりました`);

                // 次の操作でハイライト自動クリア（v1準拠）
                const autoClear = () => {
                    clearSearchHighlights();
                    document.removeEventListener('mousedown', autoClear);
                    document.removeEventListener('keydown', autoClear);
                };

                // 1秒後にイベントリスナーを登録（誤操作防止）
                setTimeout(() => {
                    document.addEventListener('mousedown', autoClear);
                    document.addEventListener('keydown', autoClear);
                }, 1000);
            }
        }
    };

    return { jumpTo };
};
