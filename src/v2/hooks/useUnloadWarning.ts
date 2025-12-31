import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * ブラウザのリロードや閉じようとした際に警告を出すフック
 */
export const useUnloadWarning = () => {
    const isAutoEditProcessing = useAppStore((state) => state.isAutoEditProcessing);
    const isEditPendingApproval = useAppStore((state) => state.isEditPendingApproval);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // 自動編集中や承認待ちの時は特に重要だが、
            // 基本的に編集中は常に警告を出すのがv1の挙動
            
            e.preventDefault();
            // モダンなブラウザではreturnValueの設定が必要（メッセージ自体はブラウザ標準になる）
            e.returnValue = '編集内容は保存されていません。このページを離れますか？';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isAutoEditProcessing, isEditPendingApproval]);
};
