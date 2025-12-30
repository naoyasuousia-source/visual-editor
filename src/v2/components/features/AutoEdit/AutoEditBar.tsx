/**
 * 自動編集バーコンポーネント
 * 自動編集成功後に表示され、承認/破棄の操作を提供
 */

import { Check, X } from 'lucide-react';

interface AutoEditBarProps {
  /** 最終自動編集時刻（ミリ秒） */
  lastEditTime: number;
  /** 承認ハンドラ */
  onApprove: () => void;
  /** 破棄ハンドラ */
  onReject: () => void;
}

/**
 * 自動編集バー
 */
export function AutoEditBar({ lastEditTime, onApprove, onReject }: AutoEditBarProps) {
  /**
   * 経過時間を「〇分前」形式でフォーマット
   */
  const formatTimeAgo = () => {
    const now = Date.now();
    const diffMs = now - lastEditTime;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return '1分未満前';
    } else if (diffMinutes === 1) {
      return '1分前';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return diffHours === 1 ? '1時間前' : `${diffHours}時間前`;
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-4 py-2">
      {/* 最終自動編集時刻 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          最終自動編集:
        </span>
        <span className="text-sm text-gray-600">
          {formatTimeAgo()}
        </span>
      </div>

      {/* ボタングループ */}
      <div className="flex items-center gap-2">
        {/* 変更承認ボタン */}
        <button
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="変更を承認"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>変更を承認</span>
        </button>

        {/* 変更を破棄ボタン */}
        <button
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="変更を破棄"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span>変更を破棄</span>
        </button>
      </div>
    </div>
  );
}
