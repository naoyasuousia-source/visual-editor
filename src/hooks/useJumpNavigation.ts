import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

/**
 * ジャンプ機能のロジックを管理するカスタムフック
 * 段落IDまたはテキスト検索によるナビゲーション機能を提供
 * Tiptap v2: Highlight拡張機能を使用した実装
 */
export const useJumpNavigation = (editor: Editor | null, isWordMode: boolean) => {
    const jumpTo = (target: string) => {
        if (!editor || !target) return;

        const { state, commands } = editor;
        const { doc } = state;

        // 1. 既存のハイライトをクリア
        // 全選択してからunsetHighlightを実行するのが一番簡単だが、履歴に残る可能性がある
        // 検索用に独自のmark typeを使っているわけではないので、すべてのハイライトが消える副作用があることに注意
        // ただしユーザー要望的には「ハイライトは一時的」なので問題ないはず
        commands.unsetHighlight();

        let targetId = target;
        
        // ID形式の自動変換
        if (!isWordMode && /^\d+-\d+$/.test(target)) {
            targetId = 'p' + target;
        } else if (isWordMode && /^\d+$/.test(target)) {
            targetId = 'p' + target;
        }

        // Tiptapのドキュメントツリーを走査してターゲットを検索
        let foundId = false;
        let targetPos = -1;

        // 段落ID検索
        doc.descendants((node, pos) => {
            if (foundId) return false;
            
            // 段落ノードのID属性をチェック
            if ((node.type.name === 'paragraph' || node.type.name === 'heading') && 
                node.attrs.id === targetId) {
                targetPos = pos;
                foundId = true;
                return false;
            }
            
            // data-para属性もチェック
            if (node.attrs['data-para'] === target || node.attrs['data-para'] === targetId) {
                targetPos = pos;
                foundId = true;
                return false;
            }
        });

        if (foundId && targetPos !== -1) {
            // 段落IDが見つかった場合
            editor.commands.focus();
            editor.commands.setTextSelection(targetPos);
            
            // エディタのビューを使用してスクロール
            const { view } = editor;
            const domAtPos = view.domAtPos(targetPos);
            const targetElement = domAtPos.node instanceof Element ? domAtPos.node : domAtPos.node.parentElement;
            
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
            
            toast.success(`${target} へジャンプしました`);
            return;
        }

        // テキスト検索フォールバック
        const matches: { from: number; to: number }[] = [];
        const lowerTarget = target.toLowerCase();

        doc.descendants((node, pos) => {
            if (node.isText) {
                const text = node.text || '';
                const lowerText = text.toLowerCase();
                let index = lowerText.indexOf(lowerTarget);
                
                while (index !== -1) {
                    matches.push({
                        from: pos + index,
                        to: pos + index + target.length
                    });
                    index = lowerText.indexOf(lowerTarget, index + 1);
                }
            }
        });

        const count = matches.length;

        if (count === 0) {
            toast.error(`指定された段落または文字列が見つかりません: ${target}`);
        } else if (count > 1) {
            toast.error(`該当箇所が複数あります（${count}箇所）。検索条件を詳しくしてください。`);
        } else {
            // 正確に1件のマッチ
            const match = matches[0];
            
            // Highlightを適用 (チェーンメソッドで一括実行)
            editor.chain()
                .focus()
                .setTextSelection({ from: match.from, to: match.to })
                .setHighlight({ color: '#ff9800' }) // オレンジ色
                .run();
                
            toast.success(`"${target}" が見つかりました`);

            // スクロール処理
            setTimeout(() => {
                 // selectionへのスクロールはTiptapが自動でやるが、確実に中央にするためにDOMを使用
                 const { view } = editor;
                 const dom = view.domAtPos(match.from);
                 const element = dom.node instanceof Element ? dom.node : dom.node.parentElement;
                 if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
            }, 50);

            // 自動クリア設定
            const clearHighlight = () => {
                editor.commands.unsetHighlight();
                document.removeEventListener('mousedown', clearHighlight);
                document.removeEventListener('keydown', clearHighlight);
            };

            setTimeout(() => {
                document.addEventListener('mousedown', clearHighlight);
                document.addEventListener('keydown', clearHighlight);
            }, 1000);
        }
    };

    return { jumpTo };
};

