/**
 * エディタロック用オーバーレイコンポーネント
 * AI編集実行中にエディタ全体を覆い、操作を無効化
 */

import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

/**
 * エディタロック用オーバーレイ
 */
export function EditorLockOverlay() {
  const isEditorLocked = useAppStore((state) => state.isEditorLocked);

  if (!isEditorLocked) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="AI編集実行中"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-white" aria-hidden="true" />
        <p className="text-base font-medium text-white">
          AI編集を反映中...
        </p>
      </div>
    </div>
  );
}
