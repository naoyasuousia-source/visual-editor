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
import { restoreParagraphFromSnapshot } from '@/utils/paragraphOperations';

/**
 * コマンドハイライト管理フック
 * 
 * @param editor - Tiptapエディタインスタンス
 * @returns ハイライト管理関数群
 */
export function useCommandHighlight(editor: Editor | null) {
  const store = useCommandHighlightStore();
  const highlights = useCommandHighlightStore(state => state.highlights);

  /**
   * 未処理（未承認かつ未破棄）のハイライト数を取得
   */
  const getPendingCount = useCallback(() => {
    return Array.from(highlights.values()).filter((h) => !h.approved && !h.rejected).length;
  }, [highlights]);

  /**
   * すべてのハイライトを取得
   */
  const getAllHighlights = useCallback(() => {
    return Array.from(highlights.values());
  }, [highlights]);

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

      // 重複チェック: 同じ段落に対する古い未承認ハイライトがあれば削除する
      // (新しいコマンドによって属性が上書きされ、古い方はDOMから消えて承認不能になるため)
      const existingHighlights = Array.from(highlights.values());
      result.affectedParagraphIds.forEach(pId => {
        const superseded = existingHighlights.find(h => 
          !h.approved && !h.rejected && h.paragraphIds.includes(pId)
        );
        if (superseded) {
          store.removeHighlight(superseded.commandId);
        }
      });

      const highlight = createHighlightFromResult(result, command);
      store.addHighlight(highlight);
    },
    [createHighlightFromResult, highlights, store]
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
      const highlight = highlights.get(commandId);
      if (!highlight || !editor) {
        if (!highlight) console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 承認済みマーク
      store.markAsApproved(commandId);

      // 1. 対象のノードを全列挙（属性ベースで確実に探す）
      const targets: { node: any; pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.attrs['data-command-id'] === commandId) {
          targets.push({ node, pos });
          // SPLIT 等で複数ノードがある場合があるため、ここでは return false しない
        }
      });

      if (targets.length > 0) {
        // 2. ドキュメントの後ろから順に処理（pos のずれを防ぐ）
        const sortedTargets = [...targets].sort((a, b) => b.pos - a.pos);
        
        sortedTargets.forEach(({ node, pos }) => {
          if (highlight.commandType === 'DELETE_PARAGRAPH') {
            // DELETE_PARAGRAPH 承認時は段落ごと削除
            editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
          } else {
            // それ以外のコマンド承認時はハイライト属性のみをクリア
            editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
              'data-command-type': null,
              'data-command-id': null,
            }).run();
          }
        });
      }

      // ハイライトを削除
      store.removeHighlight(commandId);
    },
    [editor, highlights, store]
  );

  /**
   * ハイライトを破棄して元に戻す
   */
  const rejectHighlight = useCallback(
    (commandId: string) => {
      const highlight = highlights.get(commandId);
      if (!highlight || !editor) {
        if (!highlight) console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 破棄済みマーク
      store.markAsRejected(commandId);

      // 1. エディタ上に存在する、このコマンドの影響を受けたノードを特定
      const targets: { node: any; pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.attrs['data-command-id'] === commandId) {
          targets.push({ node, pos });
        }
      });

      // 2. 後ろから順に処理
      const sortedTargets = [...targets].sort((a, b) => b.pos - a.pos);

      sortedTargets.forEach(({ node, pos }) => {
        const paragraphId = node.attrs.id || node.attrs['data-temp-id'];
        const snapshot = highlight.beforeSnapshot?.find(s => s.paragraphId === paragraphId);

        if (highlight.commandType === 'DELETE_PARAGRAPH') {
          // 削除却下：属性を外して元に戻す
          editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
            'data-command-type': null,
            'data-command-id': null,
          }).run();
        } else if (snapshot) {
          // 元の状態がある場合は復元（属性とスタイルも戻す）
          restoreParagraphFromSnapshot(editor, pos, snapshot);
        } else {
          // 元の状態がない（新規挿入された）ノードは削除
          editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
        }
      });

      // 3. スナップショットにあるがエディタ上に存在しないノードの処理（MOVE/MERGE却下用）
      // ※簡易的には上記のループで処理されないものが残るが、現状は安全のため基本的な復元に留める

      // ハイライトを削除
      store.removeHighlight(commandId);
    },
    [editor, highlights, store]
  );

  /**
   * すべてのハイライトを承認
   */
  const approveAllHighlights = useCallback(() => {
    const list = Array.from(highlights.values());
    const pending = list.filter((h) => !h.approved && !h.rejected);

    pending.forEach((highlight) => {
      approveHighlight(highlight.commandId);
    });
  }, [highlights, approveHighlight]);

  /**
   * すべてのハイライトを破棄
   */
  const rejectAllHighlights = useCallback(() => {
    const list = Array.from(highlights.values());
    const pending = list.filter((h) => !h.approved && !h.rejected);

    pending.forEach((highlight) => {
      rejectHighlight(highlight.commandId);
    });
  }, [highlights, rejectHighlight]);

  return {
    registerHighlight,
    registerMultipleHighlights,
    approveHighlight,
    rejectHighlight,
    approveAllHighlights,
    rejectAllHighlights,
    getAllHighlights,
    getHighlight: (id: string) => highlights.get(id),
    getPendingCount,
    clearAll: store.clearAll,
  };
}
