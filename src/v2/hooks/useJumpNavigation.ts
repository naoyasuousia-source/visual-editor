import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

/**
 * ジャンプ機能のロジックを管理するカスタムフック
 * 段落IDまたはテキスト検索によるナビゲーション機能を提供
 * 【重要】直接DOM操作は禁止。すべてTiptap Editor APIを経由する
 */
export const useJumpNavigation = (editor: Editor | null, isWordMode: boolean) => {
    const jumpTo = (target: string) => {
        if (!editor || !target) return;

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
            // Tiptapのコマンドを使用してフォーカスと選択を設定
            editor.commands.focus();
            editor.commands.setTextSelection(targetPos);
            
            // エディタのビューを使用してスクロール（React管理下のDOM操作）
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

        // テキスト検索フォールバック（Tiptapのドキュメント内検索）
        let textFound = false;
        editor.state.doc.descendants((node) => {
            if (textFound) return false;
            if (node.isText && node.text?.includes(target)) {
                textFound = true;
                return false;
            }
        });

        if (textFound) {
            toast.success(`"${target}" が見つかりました`);
        } else {
            toast.error('見つかりませんでした');
        }
    };

    return { jumpTo };
};
