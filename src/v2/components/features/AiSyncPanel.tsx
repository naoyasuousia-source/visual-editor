/**
 * AI同期制御パネルコンポーネント
 * AI同期の開始/停止、状態表示を提供
 */

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAiSync } from '@/hooks/useAiSync';
import type { Editor } from '@tiptap/react';
import { PlayCircle, StopCircle, RotateCcw, Circle } from 'lucide-react';

interface AiSyncPanelProps {
  /** Tiptapエディタインスタンス */
  editor: Editor | null;
}

/**
 * AI同期制御パネル
 */
export function AiSyncPanel({ editor }: AiSyncPanelProps) {
  const { isAiSyncEnabled, lastAiSyncTime } = useAppStore();
  const aiSync = useAiSync(editor);
  const [isStarting, setIsStarting] = useState(false);

  /**
   * 同期開始ハンドラ
   */
  const handleStart = async () => {
    setIsStarting(true);
    try {
      await aiSync.startSync();
    } catch (error) {
      console.error('AI同期開始エラー:', error);
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * 同期停止ハンドラ
   */
  const handleStop = () => {
    aiSync.stopSync();
  };

  /**
   * 変更を破棄（リロード）
   */
  const handleDiscard = () => {
    if (window.confirm('変更を破棄してファイルをリロードしますか？')) {
      window.location.reload();
    }
  };

  /**
   * 最終同期時刻のフォーマット
   */
  const formatLastSyncTime = () => {
    if (!lastAiSyncTime) {
      return '未同期';
    }

    const date = new Date(lastAiSyncTime);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* 状態インジケーター */}
      <div className="flex items-center gap-2">
        <Circle
          className={`h-3 w-3 animate-pulse ${
            aiSync.isWatching ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
          }`}
          aria-label={aiSync.isWatching ? '監視中' : '停止中'}
        />
        <span className="text-sm font-medium text-gray-700">
          {aiSync.isWatching ? '監視中' : '停止中'}
        </span>
      </div>

      {/* トグルボタン */}
      {!aiSync.isWatching ? (
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="AI同期を開始"
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          <span>AI同期を開始</span>
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="AI同期を停止"
        >
          <StopCircle className="h-4 w-4" aria-hidden="true" />
          <span>AI同期を停止</span>
        </button>
      )}

      {/* 最終同期時刻 */}
      <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
        <span>最終同期:</span>
        <span className="font-mono">{formatLastSyncTime()}</span>
      </div>

      {/* 変更を破棄ボタン */}
      <button
        onClick={handleDiscard}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
        aria-label="変更を破棄してリロード"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span>変更を破棄</span>
      </button>

      {/* エラー表示 */}
      {aiSync.error && (
        <div className="text-xs text-red-600" role="alert">
          エラー: {aiSync.error}
        </div>
      )}
    </div>
  );
}

