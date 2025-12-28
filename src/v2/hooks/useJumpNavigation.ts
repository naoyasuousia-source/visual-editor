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
            
            // エディタのビューを使用してスクロール
            const { view } = editor;
            const domAtPos = view.domAtPos(targetPos);
            if (domAtPos.node) {
                const element = domAtPos.node.nodeType === Node.ELEMENT_NODE 
                    ? domAtPos.node as Element
                    : domAtPos.node.parentElement;
                
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            toast.success(`${target} へジャンプしました`);
            return;
        }

        // 段落IDが見つからない場合、テキスト検索フォールバック（v1準拠）
        const editorElement = editor.view.dom;
        const containers = editorElement.querySelectorAll('[data-type="page-content"]');
        
        // コンテナが見つからない場合は、エディタ全体を検索対象にする
        const searchContainers = containers.length > 0 
            ? Array.from(containers) 
            : [editorElement];

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
