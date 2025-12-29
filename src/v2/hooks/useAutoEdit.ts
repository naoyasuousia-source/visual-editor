/**
 * 自動編集統合フック
 * ファイル監視、変更検知、自動編集フロー実行を統合管理
 */

import { useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useFileSystemWatcher } from '@/hooks/useFileSystemWatcher';
import { useCommandParser } from '@/hooks/useCommandParser';
import { useCommandExecutor } from '@/hooks/useCommandExecutor';
import { useEditApproval } from '@/hooks/useEditApproval';
import { useChangeHighlight } from '@/hooks/useChangeHighlight';
import { clearCommandArea } from '@/utils/htmlCommentParser';
import type { FileChangeEvent } from '@/types/ai-sync.types';
import { buildFullHTML } from '@/utils/aiMetadata';
import contentCssText from '@/styles/content.css?raw';

interface UseAutoEditReturn {
  /** 自動編集中かどうか */
  isProcessing: boolean;
  /** 承認待ちかどうか */
  isPendingApproval: boolean;
  /** 最終自動編集時刻 */
  lastEditTime: number | null;
  /** 承認処理 */
  approveEdit: () => Promise<void>;
  /** 破棄処理 */
  rejectEdit: () => Promise<void>;
}

/**
 * 自動編集統合フック
 * @param editor - Tiptapエディタインスタンス
 */
export function useAutoEdit(editor: Editor | null): UseAutoEditReturn {
  const {
    currentFileHandle,
    isAutoEditProcessing,
    isEditPendingApproval,
    lastAutoEditTime,
    baseFullHtml,
    setAutoEditProcessing,
    setEditPendingApproval,
    setLastAutoEditTime,
    setBaseFullHtml,
    setInternalSaving,
  } = useAppStore();

  const fileSystemWatcher = useFileSystemWatcher();
  const commandParser = useCommandParser();
  const commandExecutor = useCommandExecutor(editor);
  const editApproval = useEditApproval(editor, currentFileHandle);
  const { highlightChanges } = useChangeHighlight(editor);

  /**
   * ファイルに直接書き込み（User Gestureがある場合のみ成功）
   */
  const writeToFile = useCallback(
    async (handle: FileSystemFileHandle, content: string): Promise<void> => {
      try {
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (error) {
        console.error('[AutoEdit] ファイル書き込み失敗:', error);
        throw error;
      }
    },
    []
  );

  /**
   * ファイル変更時の自動編集フロー
   */
  const handleFileChange = useCallback(
    async (event: FileChangeEvent) => {
      // エディタ自身による保存の場合は無視
      // クロージャ問題を回避するため、getState()で最新の状態を取得
      const currentIsInternalSaving = useAppStore.getState().isInternalSaving;
      if (currentIsInternalSaving) {
        console.log('[AutoEdit] 内部保存による変更検知をスキップします');
        return;
      }

      console.log('[AutoEdit] 変更イベント受信:', event.fileHandle.name, '時刻:', event.timestamp);

      // 承認待ち中または処理中は新しい編集をブロック
      if (isEditPendingApproval || isAutoEditProcessing) {
        return;
      }

      // エディタが準備できていない場合はスキップ
      if (!editor) {
        return;
      }

      try {
        // コマンドが存在するかチェック
        if (!commandParser.hasCommands(event.content)) {
          return;
        }

        // --- ここからユーザー確認（User Gesture） ---
        // エディタを一時的にロック
        editor.setEditable(false);
        
        const confirmed = window.confirm(
          '外部からのAI編集コマンドを検知しました。\n' +
          '現在の変更を保存して、自動編集を実行しますか？'
        );

        if (!confirmed) {
          console.log('[AutoEdit] ユーザーによりキャンセルされました');
          editor.setEditable(true);
          return;
        }

        // ポジティブアクション開始
        setAutoEditProcessing(true);

        // ステップ1: コマンドをパース（エラーチェック）
        const parseResult = commandParser.parseFromHtml(event.content);
        if (parseResult.errors.length > 0) {
          const firstError = parseResult.errors[0].message;
          console.error('[AutoEdit] パースエラー:', parseResult.errors);
          toast.error(`コマンドエラー: ${firstError}`, { position: 'top-center' });
          throw new Error(`パースエラー: ${firstError}`);
        }

        // ステップ2: 編集前の状態を保存
        const preEditHtml = editor.getHTML();
        editApproval.savePreEditState(preEditHtml);

        // ステップ3: コマンドを実行
        console.log('[AutoEdit] コマンドを実行:', parseResult.commands.length, '個');
        const results = commandExecutor.executeCommands(parseResult.commands);

        // ステップ4: その結果をファイルに保存
        // 重要: event.content（AIが編集したファイル）をそのまま保存せず、
        // エディタの状態から正規のHTMLを再構築して保存する。
        // これにより、AIがコマンドエリア以外を勝手に編集していても、それは破棄される。
        console.log('[AutoEdit] 正規のHTMLを再構築して保存します');
        
        const { isWordMode, pageMargin } = useAppStore.getState();
        const marginMap: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
        const pageMarginText = marginMap[pageMargin] || '17mm';
        
        // AI画像インデックスはDOMから取得
        const aiImageIndexHtml = document.getElementById('ai-image-index')?.outerHTML || '';
        
        // 完全なHTMLを構築
        let fullHtml = buildFullHTML(
          editor,
          isWordMode,
          contentCssText,
          pageMarginText,
          aiImageIndexHtml
        );

        // コマンドエリアを注入（AIが再び書き込めるように）
        const commandAreaPlaceholder = `
<!-- AI_COMMAND_START -->
<!-- ここにコマンドを記述してください -->
<!-- AI_COMMAND_END -->
`;
        // pages-containerの直前に挿入
        fullHtml = fullHtml.replace('<div id="pages-container">', `${commandAreaPlaceholder}\n<div id="pages-container">`);

        setBaseFullHtml(fullHtml);
        
        try {
          setInternalSaving(true);
          await writeToFile(event.fileHandle, fullHtml);
        } finally {
          setInternalSaving(false);
        }

        // 実行結果をログ
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        if (failureCount > 0) {
          toast.error(`自動編集失敗: 一部のコマンドが実行できませんでした`, { position: 'top-center' });
          throw new Error('一部のコマンドが実行できませんでした');
        }

        // ステップ5: 成功時の処理
        setLastAutoEditTime(Date.now());
        setEditPendingApproval(true);

        // ハイライト表示
        const allChangedRanges = results
          .filter((r) => r.success && r.changedRanges)
          .flatMap((r) => r.changedRanges!);
        
        if (allChangedRanges.length > 0) {
          highlightChanges(allChangedRanges);
        }

        toast.success(`自動編集完了: ${successCount}個のコマンドを実行しました`, { position: 'top-center' });
        console.log('[AutoEdit] 処理完了（承認待ち、エディタロックを維持）');

      } catch (error) {
        console.error('[AutoEdit] エラー:', error);
        setEditPendingApproval(false);
        setAutoEditProcessing(false);
        if (editor) {
          editor.setEditable(true);
        }
      } finally {
        setAutoEditProcessing(false);
      }
    },
    [
      editor,
      isAutoEditProcessing,
      isEditPendingApproval,
      commandParser,
      commandExecutor,
      editApproval,
      highlightChanges,
      setAutoEditProcessing,
      setEditPendingApproval,
      setLastAutoEditTime,
      setBaseFullHtml,
      setInternalSaving,
      writeToFile,
    ]
  );

  const lastHandleRef = useRef<string | null>(null);

  /**
   * ファイル監視の自動開始
   * currentFileHandleが設定されたときに監視を開始
   */
  useEffect(() => {
    if (!currentFileHandle || !editor) {
      return;
    }

    const handle = currentFileHandle as any;
    const handleId = handle.name || 'unknown';
    if (lastHandleRef.current === handleId) {
      return;
    }

    console.log(`[AutoEdit] ファイル監視を(再)開始します: ${handleId}`);
    lastHandleRef.current = handleId;

    fileSystemWatcher.onFileChange(handleFileChange);

    if (fileSystemWatcher.isWatching) {
      fileSystemWatcher.stopWatching();
    }

    fileSystemWatcher.startWatchingWithHandle(currentFileHandle);

    return () => {};
  }, [currentFileHandle, editor, fileSystemWatcher, handleFileChange]);

  return {
    isProcessing: isAutoEditProcessing,
    isPendingApproval: isEditPendingApproval,
    lastEditTime: lastAutoEditTime,
    approveEdit: editApproval.approveEdit,
    rejectEdit: editApproval.rejectEdit,
  };
}
