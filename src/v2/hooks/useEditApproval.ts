/**
 * 承認/破棄管理フック
 * 自動編集の承認・破棄処理を管理
 */

import { useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';

interface UseEditApprovalReturn {
  /** 変更を承認 */
  approveEdit: () => Promise<void>;
  /** 変更を破棄 */
  rejectEdit: () => Promise<void>;
  /** 編集可能かどうか */
  canEdit: boolean;
  /** 編集前の状態を保存 */
  savePreEditState: (html: string) => void;
}

/**
 * 承認/破棄管理フック
 * @param editor - Tiptapエディタインスタンス
 * @param fileHandle - ファイルハンドル
 */
export function useEditApproval(
  editor: Editor | null,
  fileHandle: FileSystemFileHandle | null
): UseEditApprovalReturn {
  const { isEditPendingApproval, setEditPendingApproval } = useAppStore();

  // 編集前の状態を保存（HTMLコンテンツ）
  const preEditHtmlRef = useRef<string | null>(null);

  /**
   * 編集前の状態を保存
   */
  const savePreEditState = useCallback((html: string) => {
    preEditHtmlRef.current = html;
    console.log('[EditApproval] 編集前の状態を保存しました');
  }, []);

  /**
   * ファイルに書き込み
   */
  const writeToFile = useCallback(
    async (handle: FileSystemFileHandle, content: string): Promise<void> => {
      try {
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log('[EditApproval] ファイルを保存しました');
      } catch (error) {
        console.error('[EditApproval] ファイル保存エラー:', error);
        throw error;
      }
    },
    []
  );

  /**
   * 変更を承認
   */
  const approveEdit = useCallback(async () => {
    if (!editor || !fileHandle) {
      console.error('[EditApproval] エディタまたはファイルハンドルがありません');
      return;
    }

    try {
      console.log('[EditApproval] 変更を承認します');

      // 現在の状態でファイルを保存
      const currentHtml = editor.getHTML();
      await writeToFile(fileHandle, currentHtml);

      // 承認待ちフラグを解除
      setEditPendingApproval(false);

      // 保存した状態をクリア
      preEditHtmlRef.current = null;

      console.log('[EditApproval] 承認完了');
    } catch (error) {
      console.error('[EditApproval] 承認処理エラー:', error);
      throw error;
    }
  }, [editor, fileHandle, setEditPendingApproval, writeToFile]);

  /**
   * 変更を破棄
   */
  const rejectEdit = useCallback(async () => {
    if (!editor || !fileHandle || !preEditHtmlRef.current) {
      console.error('[EditApproval] エディタ、ファイルハンドル、または保存状態がありません');
      return;
    }

    try {
      console.log('[EditApproval] 変更を破棄します');

      // エディタを編集前の状態に復元
      editor.commands.setContent(preEditHtmlRef.current);

      // 復元後の状態でファイルを保存
      await writeToFile(fileHandle, preEditHtmlRef.current);

      // 承認待ちフラグを解除
      setEditPendingApproval(false);

      // 保存した状態をクリア
      preEditHtmlRef.current = null;

      console.log('[EditApproval] 破棄完了');
    } catch (error) {
      console.error('[EditApproval] 破棄処理エラー:', error);
      throw error;
    }
  }, [editor, fileHandle, setEditPendingApproval, writeToFile]);

  return {
    approveEdit,
    rejectEdit,
    canEdit: !isEditPendingApproval,
    savePreEditState,
  };
}
