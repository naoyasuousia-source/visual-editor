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

const POLLING_INTERVAL = 1000; // 1秒ごとにチェック

export function useFileSystemWatcher(): UseFileSystemWatcherReturn {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // setterのみ取得（値はgetStateで直接読む）
  const { setLastModified } = useAppStore();

  const changeCallbackRef = useRef<((event: FileChangeEvent) => void) | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  /**
   * ファイルの最終更新時刻を取得
   */
  const getLastModified = useCallback(async (handle: FileSystemFileHandle): Promise<number> => {
    try {
      const file = await handle.getFile();
      return file.lastModified;
    } catch (err) {
      console.error('[FileSystemWatcher] 時刻取得失敗:', err);
      return 0;
    }
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
   * クロージャ問題を避けるため、実行時にgetState()で最新の状態を取得する
   */
  const checkForChanges = useCallback(async () => {
    const handle = fileHandleRef.current;
    if (!handle || !changeCallbackRef.current) return;

    try {
      // ストアから最新の既知時刻を取得
      const knownLastModified = useAppStore.getState().lastModified;
      const currentModified = await getLastModified(handle);

      if (currentModified === 0) return;

      // 初回同期
      if (knownLastModified === 0) {
        setLastModified(currentModified);
        return;
      }

      // 変更検知
      if (currentModified > knownLastModified) {

        
        // 即座に既知時刻を更新して重複発火を防ぐ
        setLastModified(currentModified);

        // ファイル内容を読み取り、コールバックを呼び出し
        const content = await readFileContent(handle);
        const event: FileChangeEvent = {
          fileHandle: handle,
          timestamp: currentModified,
          content,
        };

        if (changeCallbackRef.current) {
          changeCallbackRef.current(event);
        }
      }
    } catch (err) {
      console.error('[FileSystemWatcher] チェックエラー:', err);
      // パーミッションエラーなどの場合は停止させる
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('ファイルへのアクセス権限がありません');
        // stopWatching(); // ユーザー操作なしで止めると不便なのでログのみ
      }
    }
  }, [setLastModified, getLastModified, readFileContent]);

  /**
   * ファイルを開いて監視を開始
   */
  const startWatching = useCallback(async () => {
    try {
      if (!('showOpenFilePicker' in window)) {
        throw new Error('このブラウザはFile System Access APIをサポートしていません');
      }

      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'HTMLファイル', accept: { 'text/html': ['.html', '.htm'] } }],
        multiple: false,
      });

      setFileHandle(handle);
      fileHandleRef.current = handle;
      setIsWatching(true);
      setError(null);

      const initialModified = await getLastModified(handle);
      setLastModified(initialModified);

      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = window.setInterval(checkForChanges, POLLING_INTERVAL);
    } catch (err) {
      console.error('[FileSystemWatcher] 開始エラー:', err);
      setError(err instanceof Error ? err.message : '監視を開始できませんでした');
    }
  }, [checkForChanges, getLastModified, setLastModified]);

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

        const initialModified = await getLastModified(handle);
        setLastModified(initialModified);

        if (pollingIntervalRef.current !== null) {
          window.clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = window.setInterval(checkForChanges, POLLING_INTERVAL);

      } catch (err) {
        console.error('[FileSystemWatcher] 外部ハンドル監視開始エラー:', err);
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
    }
  }, [getLastModified, setLastModified]);

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
