import { toast } from 'sonner';

/**
 * ジャンプ機能のロジックを管理するカスタムフック
 * 段落IDまたはテキスト検索によるナビゲーション機能を提供
 */
export const useJumpNavigation = (isWordMode: boolean) => {
    const jumpTo = (target: string) => {
        if (!target) return;
        
        let targetId = target;
        
        // ID形式の自動変換
        if (!isWordMode && /^\d+-\d+$/.test(target)) {
            targetId = 'p' + target;
        } else if (isWordMode && /^\d+$/.test(target)) {
            targetId = 'p' + target;
        }
        
        // ID検索
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.success(`${target} へジャンプしました`);
            return;
        }
        
        // テキスト検索フォールバック
        if (window.find && window.find(target)) {
            toast.success(`"${target}" が見つかりました`);
            return;
        }
        
        toast.error('見つかりませんでした');
    };

    return { jumpTo };
};
