/**
 * コマンドハイライトストア
 * コマンド実行によるハイライト状態を管理
 */

import { create } from 'zustand';
import type { HighlightState, ApprovalAction } from '@/types/command';

interface CommandHighlightStore {
  /** ハイライト状態のマップ（commandId -> HighlightState） */
  highlights: Map<string, HighlightState>;

  /** ハイライトを追加 */
  addHighlight: (highlight: HighlightState) => void;

  /** ハイライトを削除 */
  removeHighlight: (commandId: string) => void;

  /** すべてのハイライトを取得 */
  getAllHighlights: () => HighlightState[];

  /** 特定のハイライトを取得 */
  getHighlight: (commandId: string) => HighlightState | undefined;

  /** ハイライトを承認済みにマーク */
  markAsApproved: (commandId: string) => void;

  /** ハイライトを破棄済みにマーク */
  markAsRejected: (commandId: string) => void;

  /** すべてのハイライトを承認済みにマーク */
  approveAll: () => void;

  /** すべてのハイライトを破棄済みにマーク */
  rejectAll: () => void;

  /** すべてのハイライトをクリア */
  clearAll: () => void;

  /** 未処理（未承認かつ未破棄）のハイライト数を取得 */
  getPendingCount: () => number;
}

export const useCommandHighlightStore = create<CommandHighlightStore>((set, get) => ({
  highlights: new Map(),

  addHighlight: (highlight) => {
    set((state) => {
      const newHighlights = new Map(state.highlights);
      newHighlights.set(highlight.commandId, highlight);
      return { highlights: newHighlights };
    });
  },

  removeHighlight: (commandId) => {
    set((state) => {
      const newHighlights = new Map(state.highlights);
      newHighlights.delete(commandId);
      return { highlights: newHighlights };
    });
  },

  getAllHighlights: () => {
    return Array.from(get().highlights.values());
  },

  getHighlight: (commandId) => {
    return get().highlights.get(commandId);
  },

  markAsApproved: (commandId) => {
    set((state) => {
      const highlight = state.highlights.get(commandId);
      if (!highlight) return state;

      const newHighlights = new Map(state.highlights);
      newHighlights.set(commandId, {
        ...highlight,
        approved: true,
        rejected: false,
      });
      return { highlights: newHighlights };
    });
  },

  markAsRejected: (commandId) => {
    set((state) => {
      const highlight = state.highlights.get(commandId);
      if (!highlight) return state;

      const newHighlights = new Map(state.highlights);
      newHighlights.set(commandId, {
        ...highlight,
        approved: false,
        rejected: true,
      });
      return { highlights: newHighlights };
    });
  },

  approveAll: () => {
    set((state) => {
      const newHighlights = new Map(state.highlights);
      newHighlights.forEach((highlight, commandId) => {
        if (!highlight.approved && !highlight.rejected) {
          newHighlights.set(commandId, {
            ...highlight,
            approved: true,
            rejected: false,
          });
        }
      });
      return { highlights: newHighlights };
    });
  },

  rejectAll: () => {
    set((state) => {
      const newHighlights = new Map(state.highlights);
      newHighlights.forEach((highlight, commandId) => {
        if (!highlight.approved && !highlight.rejected) {
          newHighlights.set(commandId, {
            ...highlight,
            approved: false,
            rejected: true,
          });
        }
      });
      return { highlights: newHighlights };
    });
  },

  clearAll: () => {
    set({ highlights: new Map() });
  },

  getPendingCount: () => {
    const highlights = get().getAllHighlights();
    return highlights.filter((h) => !h.approved && !h.rejected).length;
  },
}));
