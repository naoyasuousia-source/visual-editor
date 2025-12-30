/**
 * コマンド承認バーコンポーネント
 * 全体承諾/全体破棄ボタンと未処理数を表示
 */

import React from 'react';

interface CommandApprovalBarProps {
  /** 未処理コマンド数 */
  pendingCount: number;
  /** 全体承諾ボタンクリック時のコールバック */
  onApproveAll: () => void;
  /** 全体破棄ボタンクリック時のコールバック */
  onRejectAll: () => void;
}

export function CommandApprovalBar({
  pendingCount,
  onApproveAll,
  onRejectAll,
}: CommandApprovalBarProps) {
  if (pendingCount === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg z-[50]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* 左側: 情報表示 */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">
              AI編集コマンドが検出されました
            </p>
            <p className="text-xs text-white/80">
              {pendingCount}個の変更が保留中です。承諾または破棄を選択してください。
            </p>
          </div>
        </div>

        {/* 右側: アクションボタン */}
        <div className="flex items-center gap-2">
          <button
            onClick={onApproveAll}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            全て承諾
          </button>
          <button
            onClick={onRejectAll}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            全て破棄
          </button>
        </div>
      </div>

      {/* 進捗インジケーター */}
      <div className="h-1 bg-white/20">
        <div
          className="h-full bg-white/60 transition-all duration-500"
          style={{ width: `${Math.max(0, 100 - (pendingCount / 10) * 100)}%` }}
        />
      </div>
    </div>
  );
}
