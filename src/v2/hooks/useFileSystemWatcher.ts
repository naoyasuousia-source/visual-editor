/**
 * File System Access APIを使用したファイル監視フック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileChangeEvent } from '@/v2/types/ai-sync.types';

interface UseFileSystemWatcherReturn {
  /** ファイルハンドル */
  fileHandle: FileSystemFileHandle | null;
  /** 監視中かどうか */
  isWatching: boolean;
  /** ファイルを開いて監視を開始 */
  startWatching: () => Promise<void>;
  /** 監視を停止 */
  stopWatching: () => void;
  /** ファイル変更イベントのコールバックを設定 */
  onFileChange: (callback: (event: FileChangeEvent) => void) => void;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * ポーリング間隔（ミリ秒）
 */
const POLLING_INTERVAL = 1000;

/**
 * File System Access APIを使用してファイル変更を監視するフック
 */
export function useFileSystemWatcher(): UseFileSystemWatcherReturn {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeCallbackRef = useRef<((event: FileChangeEvent) => void) | null>(null);
  const lastModifiedRef = useRef<number>(0);
  const pollingIntervalRef = useRef<number | null>(null);

  /**
   * ファイルの最終更新時刻を取得
   */
  const getLastModified = useCallback(async (handle: FileSystemFileHandle): Promise<number> => {
    const file = await handle.getFile();
    return file.lastModified;
  }, []);

  /**
   * ファイル内容を読み取る
   */
  const readFileContent = useCallback(async (handle: FileSystemFileHandle): Promise<string> => {
    const file = await handle.getFile();
    return await file.text();
  }, []);

  /**
   * ファイル変更をチェック
   */
  const checkForChanges = useCallback(async () => {
    if (!fileHandle || !changeCallbackRef.current) {
      return;
    }

    try {
      const currentModified = await getLastModified(fileHandle);

      // 初回または変更があった場合
      if (lastModifiedRef.current === 0) {
        lastModifiedRef.current = currentModified;
        return;
      }

      if (currentModified > lastModifiedRef.current) {
        lastModifiedRef.current = currentModified;

        // ファイル内容を読み取り、コールバックを呼び出す
        const content = await readFileContent(fileHandle);
        const event: FileChangeEvent = {
          fileHandle,
          timestamp: currentModified,
          content,
        };

        changeCallbackRef.current(event);
      }
    } catch (err) {
      console.error('ファイル変更チェックエラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
      stopWatching();
    }
  }, [fileHandle, getLastModified, readFileContent]);

  /**
   * ファイルを開いて監視を開始
   */
  const startWatching = useCallback(async () => {
    try {
      // File System Access APIがサポートされているかチェック
      if (!('showOpenFilePicker' in window)) {
        throw new Error('このブラウザはFile System Access APIをサポートしていません');
      }

      // ファイル選択ダイアログを表示
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'HTMLファイル',
            accept: {
              'text/html': ['.html', '.htm'],
            },
          },
        ],
        multiple: false,
      });

      setFileHandle(handle);
      setIsWatching(true);
      setError(null);

      // 初期の最終更新時刻を記録
      lastModifiedRef.current = await getLastModified(handle);

      // ポーリング開始
      pollingIntervalRef.current = window.setInterval(checkForChanges, POLLING_INTERVAL);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // ユーザーがキャンセルした場合は何もしない
        return;
      }
      console.error('ファイル監視開始エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    }
  }, [checkForChanges, getLastModified]);

  /**
   * 監視を停止
   */
  const stopWatching = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsWatching(false);
    lastModifiedRef.current = 0;
  }, []);

  /**
   * ファイル変更イベントのコールバックを設定
   */
  const onFileChange = useCallback((callback: (event: FileChangeEvent) => void) => {
    changeCallbackRef.current = callback;
  }, []);

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    fileHandle,
    isWatching,
    startWatching,
    stopWatching,
    onFileChange,
    error,
  };
}
