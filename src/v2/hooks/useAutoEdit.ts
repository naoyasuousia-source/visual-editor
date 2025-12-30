/**
 * 自動編集統合フック
 * ファイル監視、変更検知、自動編集フロー実行を統合管理
 * 新コマンドシステム（段落IDベース）にも対応
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
import { useCommandHighlight } from '@/hooks/useCommandHighlight';
import type { FileChangeEvent } from '@/types/ai-sync.types';
import contentCssText from '@/styles/content.css?raw';
import * as AutoEditService from '@/services/autoEditService';

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
  const commandHighlight = useCommandHighlight(editor);

  /**
   * ファイル変更時の自動編集フロー
   */
  const handleFileChange = useCallback(
    async (event: FileChangeEvent) => {
      const currentIsInternalSaving = useAppStore.getState().isInternalSaving;
      if (currentIsInternalSaving) {
        return;
      }

      if (isEditPendingApproval || isAutoEditProcessing || !editor) {
        return;
      }

      try {
        const hasValidCommands = commandParser.hasCommands(event.content);
        
        if (!hasValidCommands) {
          editor.setEditable(false);
          
          window.alert(
            '外部からのファイル変更を検知しましたが、有効なコマンドが見つかりませんでした。\n\n' +
            '不正な変更からドキュメントを保護するため、エディタの内容でファイルを上書き保存します。'
          );
          
          const { isWordMode, pageMargin } = useAppStore.getState();
          setInternalSaving(true);
          try {
            await AutoEditService.protectDocument(editor, event.fileHandle, isWordMode, pageMargin, contentCssText);
            await fileSystemWatcher.syncLastModified();
            toast.success('不正な外部変更からドキュメントを保護しました', { position: 'top-center' });
          } finally {
            setInternalSaving(false);
          }
          
          editor.setEditable(true);
          return;
        }

        editor.setEditable(false);
        const confirmed = window.confirm(
          '外部からのAI編集コマンドを検知しました。\n' +
          '現在の変更を保存して、自動編集を実行しますか？'
        );

        if (!confirmed) {
          editor.setEditable(true);
          return;
        }

        setAutoEditProcessing(true);

        // 新コマンドシステムか旧コマンドシステムかを判定
        const hasNewCommands = commandParser.hasNewCommands(event.content);

        if (hasNewCommands) {
          // 新コマンドシステムの処理
          const parseResult = commandParser.parseNewCommandsFromHtml(event.content);
          if (parseResult.errors.length > 0) {
            const firstError = parseResult.errors[0].message;
            toast.error(`コマンドエラー: ${firstError}`, { position: 'top-center' });
            throw new Error(`パースエラー: ${firstError}`);
          }

          // 編集前の状態（HTML）を保存
          editApproval.savePreEditState(editor.getHTML());

          // 新コマンド実行
          const results = commandExecutor.executeNewCommands(parseResult.commands);

          // ハイライト登録
          commandHighlight.registerMultipleHighlights(results, parseResult.commands);

          const { isWordMode, pageMargin } = useAppStore.getState();
          const fullHtml = await AutoEditService.saveExecutionResult(editor, event.fileHandle, isWordMode, pageMargin, contentCssText);
          
          setBaseFullHtml(fullHtml);
          await fileSystemWatcher.syncLastModified();

          const successCount = results.filter((r) => r.success).length;
          const failureCount = results.length - successCount;

          if (failureCount > 0) {
            const firstError = results.find(r => !r.success)?.error || '不明なエラー';
            throw new Error(`自動編集失敗: ${firstError}`);
          }

          setLastAutoEditTime(Date.now());
          // 新コマンドシステムでは承認待ちにしない（ハイライトUIで個別承認）
          setEditPendingApproval(false);
          
          // エディタを編集可能に戻す
          editor.setEditable(true);

          toast.success(`新コマンド実行完了: ${successCount}個のコマンドを実行しました`, { position: 'top-center' });
        } else {
          // 旧コマンドシステムの処理
          const parseResult = commandParser.parseFromHtml(event.content);
          if (parseResult.errors.length > 0) {
            const firstError = parseResult.errors[0].message;
            toast.error(`コマンドエラー: ${firstError}`, { position: 'top-center' });
            throw new Error(`パースエラー: ${firstError}`);
          }

          // 編集前の状態（HTML）を保存
          editApproval.savePreEditState(editor.getHTML());

          const results = commandExecutor.executeCommands(parseResult.commands);

          const { isWordMode, pageMargin } = useAppStore.getState();
          const fullHtml = await AutoEditService.saveExecutionResult(editor, event.fileHandle, isWordMode, pageMargin, contentCssText);
          
          setBaseFullHtml(fullHtml);
          await fileSystemWatcher.syncLastModified();

          const successCount = results.filter((r) => r.success).length;
          const failureCount = results.length - successCount;

          if (failureCount > 0) {
            const firstError = results.find(r => !r.success)?.error || '不明なエラー';
            throw new Error(`自動編集失敗: ${firstError}`);
          }

          setLastAutoEditTime(Date.now());
          setEditPendingApproval(true);

          const allChangedRanges = results
            .filter((r) => r.success && r.changedRanges)
            .flatMap((r) => r.changedRanges!);
          
          if (allChangedRanges.length > 0) {
            editor.setEditable(true);
            highlightChanges(allChangedRanges);
            editor.setEditable(false);
          }

          toast.success(`自動編集完了: ${successCount}個のコマンドを実行しました`, { position: 'top-center' });
        }

      } catch (error) {
        console.error('[AutoEdit] エラーが発生:', error);
        
        if (editor && event.fileHandle) {
          try {
            const { isWordMode, pageMargin } = useAppStore.getState();
            setInternalSaving(true);
            await AutoEditService.protectDocument(editor, event.fileHandle, isWordMode, pageMargin, contentCssText);
            await fileSystemWatcher.syncLastModified();
            toast.info('不完全な編集内容を検知したため、ファイルを正常な状態に復旧しました', { position: 'top-center' });
          } catch (saveError) {
            console.error('[AutoEdit] エラー時の保存失敗:', saveError);
          } finally {
            setInternalSaving(false);
          }
        }

        setEditPendingApproval(false);
        setAutoEditProcessing(false);
        if (editor) editor.setEditable(true);
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
      commandHighlight,
      setAutoEditProcessing,
      setEditPendingApproval,
      setLastAutoEditTime,
      setBaseFullHtml,
      setInternalSaving,
      fileSystemWatcher,
    ]
  );

  const lastHandleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentFileHandle || !editor) return;

    const handleId = currentFileHandle.name;
    if (lastHandleRef.current === handleId) return;

    lastHandleRef.current = handleId;
    fileSystemWatcher.onFileChange(handleFileChange);

    if (fileSystemWatcher.isWatching) {
      fileSystemWatcher.stopWatching();
    }
    fileSystemWatcher.startWatchingWithHandle(currentFileHandle);
  }, [currentFileHandle, editor, fileSystemWatcher, handleFileChange]);

  return {
    isProcessing: isAutoEditProcessing,
    isPendingApproval: isEditPendingApproval,
    lastEditTime: lastAutoEditTime,
    approveEdit: editApproval.approveEdit,
    rejectEdit: editApproval.rejectEdit,
  };
}
