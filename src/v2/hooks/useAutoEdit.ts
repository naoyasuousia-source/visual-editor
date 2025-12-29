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
  } = useAppStore();

  const fileSystemWatcher = useFileSystemWatcher();
  const commandParser = useCommandParser();
  const commandExecutor = useCommandExecutor(editor);
  const editApproval = useEditApproval(editor, currentFileHandle);
  const { highlightChanges } = useChangeHighlight(editor);

  const isWatchingRef = useRef(false);

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
   * ファイル変更時の自動編集フロー
   */
  const handleFileChange = useCallback(
    async (event: FileChangeEvent) => {
      console.log('[AutoEdit] 変更イベント受信:', event.fileHandle.name, '時刻:', event.timestamp);

      // 承認待ち中は新しい編集をブロック
      if (isEditPendingApproval) {
        console.error('[AutoEdit] 承認待ち中です。前回の編集を承認または破棄してください。');
        toast.error('前回の自動編集を承認または破棄してください', {
          position: 'top-center',
        });
        return;
      }

      // 処理中は重複実行を防止
      if (isAutoEditProcessing) {
        return;
      }

      // エディタが準備できていない場合はスキップ
      if (!editor) {
        return;
      }

      try {
        console.log('[AutoEdit] ファイル変更を検知:', event.timestamp);

        // コマンドが存在するかチェック
        if (!commandParser.hasCommands(event.content)) {
          console.log('[AutoEdit] コマンドが見つかりません');
          return;
        }

        // ステップ1: エディタをロック
        console.log('[AutoEdit] エディタをロック');
        setAutoEditProcessing(true);
        editor.setEditable(false);

        // ステップ2: 編集前の状態を保存
        const preEditHtml = editor.getHTML();
        editApproval.savePreEditState(preEditHtml);

        // ステップ3: コマンドをパース
        const parseResult = commandParser.parseFromHtml(event.content);
        console.log('[AutoEdit] パース結果:', parseResult);

        if (parseResult.errors.length > 0) {
          console.error('[AutoEdit] パースエラー:', parseResult.errors);
          toast.error(`コマンドパースエラー: ${parseResult.errors[0].message}`, {
            position: 'top-center',
          });
          throw new Error(`コマンドパースエラー: ${parseResult.errors[0].message}`);
        }

        if (parseResult.commands.length === 0) {
          console.log('[AutoEdit] 実行可能なコマンドがありません');
          return;
        }

        // ステップ4: コマンドエリアをクリア
        console.log('[AutoEdit] コマンドエリアをクリアしてベースHTMLを更新');
        const clearedContent = clearCommandArea(event.content);
        setBaseFullHtml(clearedContent);

        // ステップ5: 自動保存（スキップ）
        // ブラウザの制限によりユーザー操作なしでの書き込みは不可
        console.log('[AutoEdit] ステップ5 (自動保存) をスキップします（承認時に実行されます）');

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 50));

        // ステップ6: コマンドを実行
        console.log('[AutoEdit] コマンドを実行:', parseResult.commands.length, '個');
        const results = commandExecutor.executeCommands(parseResult.commands);

        // 実行結果をログとトースト
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        results.forEach((result, index) => {
          if (result.success) {
            console.log(`[AutoEdit] コマンド${index + 1}実行成功`);
          } else {
            console.error(`[AutoEdit] コマンド${index + 1}実行失敗:`, result.error);
          }
        });

        if (failureCount > 0) {
          toast.error(`自動編集失敗: ${failureCount}個のコマンドが実行できませんでした`, {
            position: 'top-center',
          });
          throw new Error('一部のコマンドが実行できませんでした');
        }

        // ステップ7: 成功時の処理
        setLastAutoEditTime(Date.now());
        setEditPendingApproval(true);

        // ハイライト表示
        const allChangedRanges = results
          .filter((r) => r.success && r.changedRanges)
          .flatMap((r) => r.changedRanges!);
        
        if (allChangedRanges.length > 0) {
          highlightChanges(allChangedRanges);
        }

        // 承認待ち中はエディタをロックしたまま（setEditableは呼ばない）

        toast.success(`自動編集成功: ${successCount}個のコマンドを実行しました`, {
          position: 'top-center',
        });

        console.log('[AutoEdit] 処理完了（承認待ち、エディタロックを維持）');
      } catch (error) {
        console.error('[AutoEdit] エラー:', error);
        // エラー時は承認待ちにしない
        setEditPendingApproval(false);
        // エディタのロックを解除
        setAutoEditProcessing(false);
        if (editor) {
          editor.setEditable(true);
        }
      } finally {
        // 成功時はisAutoEditProcessingだけ解除
        // エディタのロック（setEditable(false)）は承認/破棄まで維持
        if (!isEditPendingApproval) {
          // エラー時のみここに到達
          setAutoEditProcessing(false);
        } else {
          // 成功時
          setAutoEditProcessing(false);
        }
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

    // ハンドルが変更されたかチェック
    const handleName = (currentFileHandle as any).name;
    if (lastHandleRef.current === handleName) {
      return;
    }

    console.log(`[AutoEdit] ファイル監視を(再)開始します: ${handleName}`);
    lastHandleRef.current = handleName;

    // ファイル変更イベントのリスナーを設定
    fileSystemWatcher.onFileChange(handleFileChange);

    // 既に監視中の場合は一旦停止
    if (fileSystemWatcher.isWatching) {
      fileSystemWatcher.stopWatching();
    }

    // 外部ハンドルで監視を開始
    fileSystemWatcher.startWatchingWithHandle(currentFileHandle);

    return () => {
      // クリーンアップでは停止しない（エディタが開いている間は監視し続けるため）
      // ただしハンドルが変わった場合は上記if文で停止される
    };
  }, [currentFileHandle, editor, fileSystemWatcher, handleFileChange]);

  return {
    isProcessing: isAutoEditProcessing,
    isPendingApproval: isEditPendingApproval,
    lastEditTime: lastAutoEditTime,
    approveEdit: editApproval.approveEdit,
    rejectEdit: editApproval.rejectEdit,
  };
}
