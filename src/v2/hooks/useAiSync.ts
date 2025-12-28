/**
 * AI同期編集の統合フック
 * ファイル監視、コマンド解析、実行を統合管理
 */

import { useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';
import { useFileSystemWatcher } from '@/hooks/useFileSystemWatcher';
import { useCommandParser } from '@/hooks/useCommandParser';
import { useCommandExecutor } from '@/hooks/useCommandExecutor';
import { clearCommandArea } from '@/utils/htmlCommentParser';
import type { FileChangeEvent } from '@/types/ai-sync.types';

interface UseAiSyncReturn {
  /** AI同期を開始 */
  startSync: () => Promise<void>;
  /** AI同期を停止 */
  stopSync: () => void;
  /** 同期中かどうか */
  isWatching: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * AI同期編集の統合フック
 * @param editor - Tiptapエディタインスタンス
 */
export function useAiSync(editor: Editor | null): UseAiSyncReturn {
  const {
    isAiSyncEnabled,
    isEditorLocked,
    setAiSyncEnabled,
    setEditorLocked,
    setLastAiSyncTime,
  } = useAppStore();

  const fileSystemWatcher = useFileSystemWatcher();
  const commandParser = useCommandParser();
  const commandExecutor = useCommandExecutor(editor);

  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

  /**
   * ファイルに書き込み
   */
  const writeToFile = useCallback(
    async (handle: FileSystemFileHandle, content: string): Promise<void> => {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    },
    []
  );

  /**
   * ファイル変更時の処理
   */
  const handleFileChange = useCallback(
    async (event: FileChangeEvent) => {
      if (!editor || isEditorLocked) {
        return;
      }

      try {
        console.log('[AI Sync] ファイル変更を検知:', event.timestamp);

        // コマンドが存在するかチェック
        if (!commandParser.hasCommands(event.content)) {
          console.log('[AI Sync] コマンドが見つかりません');
          return;
        }

        // ステップ1: エディタをロック
        console.log('[AI Sync] エディタをロック');
        setEditorLocked(true);

        // Tiptapエディタを編集不可に
        if (editor) {
          editor.setEditable(false);
        }

        // ステップ2: コマンドをパース
        const parseResult = commandParser.parseFromHtml(event.content);
        console.log('[AI Sync] パース結果:', parseResult);

        if (parseResult.errors.length > 0) {
          console.error('[AI Sync] パースエラー:', parseResult.errors);
          // エラーがあってもロックは解除
          throw new Error(
            `コマンドパースエラー: ${parseResult.errors[0].message}`
          );
        }

        if (parseResult.commands.length === 0) {
          console.log('[AI Sync] 実行可能なコマンドがありません');
          throw new Error('実行可能なコマンドがありません');
        }

        // ステップ3: コマンドエリアをクリア
        console.log('[AI Sync] コマンドエリアをクリア');
        const clearedContent = clearCommandArea(event.content);

        // ステップ4: ファイルを自動保存（コマンド実行前の状態）
        console.log('[AI Sync] ファイルを自動保存');
        await writeToFile(event.fileHandle, clearedContent);

        // 少し待機（ファイル書き込みの完了を確実にする）
        await new Promise((resolve) => setTimeout(resolve, 100));

        // ステップ5: コマンドを実行
        console.log('[AI Sync] コマンドを実行:', parseResult.commands.length, '個');
        const results = commandExecutor.executeCommands(parseResult.commands);

        // 実行結果をログ
        results.forEach((result, index) => {
          if (result.success) {
            console.log(`[AI Sync] コマンド${index + 1}実行成功`);
          } else {
            console.error(`[AI Sync] コマンド${index + 1}実行失敗:`, result.error);
          }
        });

        // ステップ6: 最終同期時刻を更新
        setLastAiSyncTime(Date.now());

        // ステップ7: 少し待機してレンダリング完了を待つ
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log('[AI Sync] 処理完了');
      } catch (error) {
        console.error('[AI Sync] エラー:', error);
      } finally {
        // ステップ8: エディタのロックを解除
        console.log('[AI Sync] エディタのロックを解除');
        setEditorLocked(false);

        // Tiptapエディタを編集可能に
        if (editor) {
          editor.setEditable(true);
        }
      }
    },
    [
      editor,
      isEditorLocked,
      commandParser,
      commandExecutor,
      setEditorLocked,
      setLastAiSyncTime,
      writeToFile,
    ]
  );

  /**
   * AI同期を開始
   */
  const startSync = useCallback(async () => {
    try {
      await fileSystemWatcher.startWatching();
      setAiSyncEnabled(true);
      fileHandleRef.current = fileSystemWatcher.fileHandle;
      console.log('[AI Sync] 同期を開始しました');
    } catch (error) {
      console.error('[AI Sync] 同期開始エラー:', error);
      throw error;
    }
  }, [fileSystemWatcher, setAiSyncEnabled]);

  /**
   * AI同期を停止
   */
  const stopSync = useCallback(() => {
    fileSystemWatcher.stopWatching();
    setAiSyncEnabled(false);
    fileHandleRef.current = null;
    console.log('[AI Sync] 同期を停止しました');
  }, [fileSystemWatcher, setAiSyncEnabled]);

  /**
   * ファイル変更イベントのリスナーを設定
   */
  useEffect(() => {
    fileSystemWatcher.onFileChange(handleFileChange);
  }, [fileSystemWatcher, handleFileChange]);

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (isAiSyncEnabled) {
        stopSync();
      }
    };
  }, [isAiSyncEnabled, stopSync]);

  return {
    startSync,
    stopSync,
    isWatching: fileSystemWatcher.isWatching,
    error: fileSystemWatcher.error,
  };
}
