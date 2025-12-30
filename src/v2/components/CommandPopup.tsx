/**
 * コマンドポップアップコンポーネント
 * ハイライトされた段落にホバーした際に表示される承認/破棄UI
 */

import React, { useState, useEffect, useRef } from 'react';
import type { HighlightState } from '@/types/command';

interface CommandPopupProps {
  /** ハイライト状態 */
  highlight: HighlightState;
  /** ポップアップ表示位置（target要素） */
  targetElement: HTMLElement | null;
  /** 承諾ボタンクリック時のコールバック */
  onApprove: (commandId: string) => void;
  /** 破棄ボタンクリック時のコールバック */
  onReject: (commandId: string) => void;
  /** クローズコールバック */
  onClose: () => void;
}

/**
 * コマンドタイプに応じた表示内容を取得
 */
function getCommandDisplayInfo(highlight: HighlightState): {
  title: string;
  color: string;
  content: React.ReactNode;
} {
  const { commandType, beforeSnapshot, command } = highlight;

  switch (commandType) {
    case 'REPLACE_PARAGRAPH':
      return {
        title: '段落置換',
        color: 'bg-blue-500',
        content: (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">変更前:</p>
              <p className="text-sm bg-gray-100 p-2 rounded line-through">
                {beforeSnapshot[0]?.text || '（内容なし）'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">変更後:</p>
              <p className="text-sm bg-blue-50 p-2 rounded">
                {command.type === 'REPLACE_PARAGRAPH' ? command.text : ''}
              </p>
            </div>
          </div>
        ),
      };

    case 'INSERT_PARAGRAPH':
      return {
        title: '段落挿入',
        color: 'bg-green-500',
        content: (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">挿入内容:</p>
            <p className="text-sm bg-green-50 p-2 rounded">
              {command.type === 'INSERT_PARAGRAPH' ? command.text : ''}
            </p>
          </div>
        ),
      };

    case 'DELETE_PARAGRAPH':
      return {
        title: '段落削除',
        color: 'bg-red-500',
        content: (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">削除予定:</p>
            <p className="text-sm bg-red-50 p-2 rounded line-through opacity-70">
              {beforeSnapshot[0]?.text || '（内容なし）'}
            </p>
          </div>
        ),
      };

    case 'MOVE_PARAGRAPH':
      return {
        title: '段落移動',
        color: 'bg-purple-500',
        content: (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">移動元:</p>
            <p className="text-sm bg-purple-50 p-2 rounded">
              {command.type === 'MOVE_PARAGRAPH' ? `${command.sourceId} → ${command.targetId}` : ''}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {beforeSnapshot[0]?.text || ''}
            </p>
          </div>
        ),
      };

    case 'SPLIT_PARAGRAPH':
      return {
        title: '段落分割',
        color: 'bg-orange-500',
        content: (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">分割結果:</p>
            <div className="space-y-1">
              <p className="text-sm bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                前半部分
              </p>
              <p className="text-sm bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                後半部分
              </p>
            </div>
          </div>
        ),
      };

    case 'MERGE_PARAGRAPH':
      return {
        title: '段落結合',
        color: 'bg-teal-500',
        content: (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">結合前:</p>
            <div className="space-y-1 mb-2">
              {beforeSnapshot.map((snapshot, i) => (
                <p key={i} className="text-xs bg-gray-100 p-2 rounded">
                  {snapshot.text}
                </p>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-semibold mb-1">結合後:</p>
            <p className="text-sm bg-teal-50 p-2 rounded">
              {beforeSnapshot.map(s => s.text).join('')}
            </p>
          </div>
        ),
      };

    default:
      return {
        title: '不明なコマンド',
        color: 'bg-gray-500',
        content: <p className="text-sm">コマンド情報が見つかりません</p>,
      };
  }
}

export function CommandPopup({
  highlight,
  targetElement,
  onApprove,
  onReject,
  onClose,
}: CommandPopupProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayInfo = getCommandDisplayInfo(highlight);

  // ポップアップの位置を計算
  useEffect(() => {
    if (!targetElement || !popupRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();

    // ターゲット要素の下に表示、画面外に出る場合は上に表示
    let top = targetRect.bottom + 8;
    let left = targetRect.left;

    // 画面右端を超える場合は左寄せ
    if (left + popupRect.width > window.innerWidth) {
      left = window.innerWidth - popupRect.width - 16;
    }

    // 画面左端を割り込む場合は右に調整
    if (left < 16) {
      left = 16;
    }

    // 画面下端を超える場合は上に表示
    if (top + popupRect.height > window.innerHeight) {
      top = targetRect.top - popupRect.height - 8;
    }

    // 画面上端を割り込む場合は下に調整
    if (top < 16) {
      top = 16;
    }

    setPosition({ top, left });
  }, [targetElement]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className={`fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md transition-opacity duration-200 ${
        position ? 'opacity-100' : 'opacity-0 invisible'
      }`}
      style={{
        top: position ? `${position.top}px` : '0px',
        left: position ? `${position.left}px` : '0px',
      }}
    >
      {/* ヘッダー */}
      <div className={`${displayInfo.color} text-white px-4 py-2 rounded-t-lg flex items-center justify-between`}>
        <h3 className="font-semibold text-sm">{displayInfo.title}</h3>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="閉じる"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {displayInfo.content}
      </div>

      {/* アクションボタン */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onApprove(highlight.commandId)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          ✓ 承諾
        </button>
        <button
          onClick={() => onReject(highlight.commandId)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          ✕ 破棄
        </button>
      </div>
    </div>
  );
}
