/**
 * File System Access APIを使用したファイル監視フック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileChangeEvent } from '@/types/ai-sync.types';
import { useAppStore } from '@/store/useAppStore';

interface UseFileSystemWatcherReturn {
  /** ファイルハンドル */
  fileHandle: FileSystemFileHandle | null;
  /** 監視中かどうか */
  isWatching: boolean;
  /** ファイルを開いて監視を開始 */
  startWatching: () => Promise<void>;
  /** 外部ファイルハンドルで監視を開始 */
  startWatchingWithHandle: (handle: FileSystemFileHandle) => void;
  /** 監視を停止 */
  stopWatching: () => void;
  /** ファイル変更イベントのコールバックを設定 */
  onFileChange: (callback: (event: FileChangeEvent) => void) => void;
  /** 現在のファイルの時刻を同期（次の変更検知をスキップ用） */
  syncLastModified: () => Promise<void>;
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
  const { lastModified, setLastModified } = useAppStore();

  const changeCallbackRef = useRef<((event: FileChangeEvent) => void) | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
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
    const handle = fileHandleRef.current;
    if (!handle || !changeCallbackRef.current) {
      return;
    }

    try {
      const currentModified = await getLastModified(handle);

      // 初回または変更があった場合
      if (lastModified === 0) {
        setLastModified(currentModified);
        return;
      }

      if (currentModified > lastModified) {
        setLastModified(currentModified);

        // ファイル内容を読み取り、コールバックを呼び出す
        const content = await readFileContent(handle);
        const event: FileChangeEvent = {
          fileHandle: handle,
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
  }, [lastModified, setLastModified, getLastModified, readFileContent]);

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
      fileHandleRef.current = handle;
      setIsWatching(true);
      setError(null);

      // 初期の最終更新時刻を記録
      const initialModified = await getLastModified(handle);
      setLastModified(initialModified);

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
   * 外部ファイルハンドルで監視を開始
   */
  const startWatchingWithHandle = useCallback(
    async (handle: FileSystemFileHandle) => {
      try {
        setFileHandle(handle);
        fileHandleRef.current = handle;
        setIsWatching(true);
        setError(null);

        // 初期の最終更新時刻を記録
        const initialModified = await getLastModified(handle);
        setLastModified(initialModified);

        // 既にポーリング中の場合は停止
        if (pollingIntervalRef.current !== null) {
          window.clearInterval(pollingIntervalRef.current);
        }

        // ポーリング開始
        pollingIntervalRef.current = window.setInterval(checkForChanges, POLLING_INTERVAL);
        
        console.log('[FileSystemWatcher] 外部ハンドルで監視を開始しました');
      } catch (err) {
        console.error('[FileSystemWatcher] 監視開始エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラー');
      }
    },
    [checkForChanges, getLastModified, setLastModified]
  );

  /**
   * 監視を停止
   */
  const stopWatching = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsWatching(false);
    setLastModified(0);
    fileHandleRef.current = null;
  }, [setLastModified]);

  /**
   * ファイル変更イベントのコールバックを設定
   */
  const onFileChange = useCallback((callback: (event: FileChangeEvent) => void) => {
    changeCallbackRef.current = callback;
  }, []);

  /**
   * 現在のファイルの時刻を同期
   */
  const syncLastModified = useCallback(async () => {
    const handle = fileHandleRef.current;
    if (handle) {
      const currentModified = await getLastModified(handle);
      setLastModified(currentModified);
      console.log('[FileSystemWatcher] 時刻を同期しました（変更検知スキップ）');
    }
  }, [getLastModified, setLastModified]);

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
    startWatchingWithHandle,
    stopWatching,
    onFileChange,
    syncLastModified,
    error,
  };
}
