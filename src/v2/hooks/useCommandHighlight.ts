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

      const highlight = createHighlightFromResult(result, command);
      store.addHighlight(highlight);

      console.log(`ハイライト登録: ${highlight.commandType} (影響段落: ${highlight.paragraphIds.join(', ')})`);
    },
    [createHighlightFromResult, store]
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
      if (!highlight) {
        console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 承認済みマーク
      store.markAsApproved(commandId);

      // ハイライトの影響を受ける段落を処理
      if (editor) {
        highlight.paragraphIds.forEach((paragraphId) => {
          // 段落を検索
          editor.state.doc.descendants((node, pos) => {
            if (
              (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId) &&
              node.attrs['data-command-id'] === commandId
            ) {
              if (highlight.commandType === 'DELETE_PARAGRAPH') {
                // DELETE_PARAGRAPH 承認時は段落ごと削除
                editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
              } else {
                // それ以外のコマンド承認時はハイライト属性のみをクリア（確定）
                editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
                  'data-command-type': null,
                  'data-command-id': null,
                }).run();
              }
              // 同じIDのノードは1つのはずなので、見つけたらこのパスの探索は終了
              return false;
            }
          });
        });
      }

      // ハイライトを削除
      store.removeHighlight(commandId);

      console.log(`ハイライト承認: ${commandId}`);
    },
    [editor, highlights, store]
  );

  /**
   * ハイライトを破棄して元に戻す
   */
  const rejectHighlight = useCallback(
    (commandId: string) => {
      const highlight = highlights.get(commandId);
      if (!highlight) {
        console.error('ハイライトが見つかりません:', commandId);
        return;
      }

      // 破棄済みマーク
      store.markAsRejected(commandId);

      // ハイライトを破棄（元に戻す）
      if (editor) {
        const type = highlight.commandType;

        if (type === 'DELETE_PARAGRAPH') {
          // 削除却下時：マークを外すだけ
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
                return false;
              }
            });
          });
        } else {
          // INSERT, REPLACE, MOVE, SPLIT, MERGE の却下処理

          // 1. このコマンドで新規作成された段落（または移動先の段落）を削除
          // INSERT_PARAGRAPH, SPLIT_PARAGRAPH(新), MOVE_PARAGRAPH(新)などが対象
          highlight.paragraphIds.forEach((paragraphId) => {
            // スナップショットにあるID（元の段落）は削除してはいけない
            const isOriginalParagraph = highlight.beforeSnapshot?.some(s => s.paragraphId === paragraphId);
            
            if (!isOriginalParagraph) {
              editor.state.doc.descendants((node, pos) => {
                if (
                  (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId) &&
                  node.attrs['data-command-id'] === commandId
                ) {
                  editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
                  return false;
                }
              });
            }
          });

          // 2. 元の状態（スナップショット）がある場合は、それを元の位置に復元
          // REPLACE, DELETE(マーク解除済み), MOVE(元位置へ), SPLIT(統合), MERGE(分割)
          if (highlight.beforeSnapshot && highlight.beforeSnapshot.length > 0) {
            highlight.beforeSnapshot.forEach((snapshot: ParagraphSnapshot) => {
              // 既にエディタ上に存在する元の段落（REPLACE等で属性だけ変わったもの）を検索
              let foundPos: number | null = null;
              editor.state.doc.descendants((node, pos) => {
                if (
                  (node.attrs.id === snapshot.paragraphId || node.attrs['data-temp-id'] === snapshot.paragraphId)
                ) {
                  foundPos = pos;
                  return false;
                }
              });

              if (foundPos !== null) {
                // 存在するなら置換
                editor.chain().focus().setNodeSelection(foundPos).deleteSelection().insertContentAt(foundPos, {
                  type: 'paragraph',
                  attrs: {
                    id: snapshot.paragraphId,
                    'data-command-type': null,
                    'data-command-id': null,
                  },
                  content: snapshot.text ? [{ type: 'text', text: snapshot.text }] : [],
                }).run();
              } else if (snapshot.id) {
                // 存在しない場合（MOVEやMERGEで消された場合）は、スナップショットがあれば適切な位置に挿入したいが、
                // 簡易的には現在の末尾や前の位置を特定する必要がある。
                // 現状は安全のため、見つかった場合のみ復元。
              }
            });
          }

          // 3. 残っている属性を念のためクリア
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
                return false;
              }
            });
          });
        }
      }

      // ハイライトを削除
      store.removeHighlight(commandId);

      console.log(`ハイライト破棄: ${commandId}`);
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

    console.log(`全ハイライト承認: ${pending.length}件`);
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

    console.log(`全ハイライト破棄: ${pending.length}件`);
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
