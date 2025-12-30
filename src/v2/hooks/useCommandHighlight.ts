/**
 * コマンドハイライト管理フック
 * コマンド実行結果をハイライトとして登録・管理
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  CommandExecutionResult,
  HighlightState,
  Command,
  ParagraphSnapshot,
} from '@/types/command';
import { useCommandHighlightStore } from '@/store/useCommandHighlightStore';

/**
 * コマンドハイライト管理フック
 * 
 * @param editor - Tiptapエディタインスタンス
 * @returns ハイライト管理関数群
 */
export function useCommandHighlight(editor: Editor | null) {
  const {
    addHighlight,
    removeHighlight,
    getAllHighlights,
    getHighlight,
    markAsApproved,
    markAsRejected,
    approveAll,
    rejectAll,
    clearAll,
    getPendingCount,
  } = useCommandHighlightStore();

  /**
   * コマンド実行結果からハイライト状態を作成
   */
  const createHighlightFromResult = useCallback(
    (result: CommandExecutionResult, command: Command): HighlightState => {
      return {
        commandId: result.commandId,
        commandType: result.commandType,
        paragraphIds: result.affectedParagraphIds,
        beforeSnapshot: result.beforeSnapshot || [],
        command,
        approved: false,
        rejected: false,
        timestamp: result.timestamp,
      };
    },
    []
  );

  /**
   * コマンド実行結果をハイライトとして登録
   */
  const registerHighlight = useCallback(
    (result: CommandExecutionResult, command: Command) => {
      if (!result.success) {
        console.error('失敗したコマンドはハイライト登録されません:', result.error);
        return;
      }

      const highlight = createHighlightFromResult(result, command);
      addHighlight(highlight);

      console.log(`ハイライト登録: ${highlight.commandType} (影響段落: ${highlight.paragraphIds.join(', ')})`);
    },
    [createHighlightFromResult, addHighlight]
  );

  /**
   * 複数のコマンド実行結果をハイライトとして一括登録
   */
  const registerMultipleHighlights = useCallback(
    (results: CommandExecutionResult[], commands: Command[]) => {
      results.forEach((result, index) => {
        const command = commands[index];
        if (command && result.success) {
          registerHighlight(result, command);
        }
      });
    },
    [registerHighlight]
  );

  /**
   * ハイライトを承認して削除
   */
  const approveHighlight = useCallback(
    (commandId: string) => {
      const highlight = getHighlight(commandId);
      if (!highlight) {
        console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 承認済みマーク
      markAsApproved(commandId);

      // data-command属性を削除
      if (editor) {
        highlight.paragraphIds.forEach((paragraphId) => {
          // 段落を検索して属性をクリア
          editor.state.doc.descendants((node, pos) => {
            if (
              (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId) &&
              node.attrs['data-command-id'] === commandId
            ) {
              editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
                'data-command-type': null,
                'data-command-id': null,
              }).run();
            }
          });
        });
      }

      // ハイライトを削除
      removeHighlight(commandId);

      console.log(`ハイライト承認: ${commandId}`);
    },
    [editor, getHighlight, markAsApproved, removeHighlight]
  );

  /**
   * ハイライトを破棄して元に戻す
   */
  const rejectHighlight = useCallback(
    (commandId: string) => {
      const highlight = getHighlight(commandId);
      if (!highlight) {
        console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 破棄済みマーク
      markAsRejected(commandId);

      // 段落を元の状態に復元
      if (editor && highlight.beforeSnapshot) {
        highlight.beforeSnapshot.forEach((snapshot: ParagraphSnapshot) => {
          editor.state.doc.descendants((node, pos) => {
            if (
              (node.attrs.id === snapshot.paragraphId || node.attrs['data-temp-id'] === snapshot.paragraphId) &&
              node.attrs['data-command-id'] === commandId
            ) {
              // 段落を元のテキストで置換
              editor.chain().focus().setNodeSelection(pos).deleteSelection().insertContentAt(pos, {
                type: 'paragraph',
                attrs: {
                  id: snapshot.paragraphId,
                  // data-command属性はクリア
                  'data-command-type': null,
                  'data-command-id': null,
                },
                content: [{ type: 'text', text: snapshot.text }],
              }).run();
            }
          });
        });
      }

      // DELETE_PARAGRAPHコマンドの場合は削除マークを解除
      if (highlight.commandType === 'DELETE_PARAGRAPH' && editor) {
        highlight.paragraphIds.forEach((paragraphId) => {
          editor.state.doc.descendants((node, pos) => {
            if (
              (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId) &&
              node.attrs['data-command-id'] === commandId
            ) {
              editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
                'data-command-type': null,
                'data-command-id': null,
              }).run();
            }
          });
        });
      }

      // ハイライトを削除
      removeHighlight(commandId);

      console.log(`ハイライト破棄: ${commandId}`);
    },
    [editor, getHighlight, markAsRejected, removeHighlight]
  );

  /**
   * すべてのハイライトを承認
   */
  const approveAllHighlights = useCallback(() => {
    const highlights = getAllHighlights();
    const pending = highlights.filter((h) => !h.approved && !h.rejected);

    pending.forEach((highlight) => {
      approveHighlight(highlight.commandId);
    });

    console.log(`全ハイライト承認: ${pending.length}件`);
  }, [getAllHighlights, approveHighlight]);

  /**
   * すべてのハイライトを破棄
   */
  const rejectAllHighlights = useCallback(() => {
    const highlights = getAllHighlights();
    const pending = highlights.filter((h) => !h.approved && !h.rejected);

    pending.forEach((highlight) => {
      rejectHighlight(highlight.commandId);
    });

    console.log(`全ハイライト破棄: ${pending.length}件`);
  }, [getAllHighlights, rejectHighlight]);

  return {
    registerHighlight,
    registerMultipleHighlights,
    approveHighlight,
    rejectHighlight,
    approveAllHighlights,
    rejectAllHighlights,
    getAllHighlights,
    getHighlight,
    getPendingCount,
    clearAll,
  };
}
