import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

/**
 * InlineTab Extension
 * 
 * v1のinline-tab機能をTiptapで再現します。
 * Tabキーを押すと、36pt (48px) グリッドの次の位置までのスペースを挿入します。
 * 
 * 【v1との互換性】
 * - インデントステップ: 36pt = 48px (96dpi換算)
 * - inline-tab要素: <span class="inline-tab" style="width: Xpx"></span>
 * - CSS: src/v2/styles/content.css の .inline-tab を使用
 */

// インデントステップ（v1準拠）
const INDENT_STEP_PX = 36 * (96 / 72); // = 48px

/**
 * インラインタブ計算用の情報
 */
interface TabCalculationInfo {
    relX: number;    // 本文開始位置からの相対X座標 (px)
    originX: number; // 本文開始位置の絶対X座標 (px)
}

/**
 * ページの本文開始位置（.page-inner）を基準としたキャレット位置を取得
 */
function getTabCalculationInfo(editor: Editor): TabCalculationInfo {
    const { view } = editor;
    const { state } = view;
    const { from } = state.selection;
    
    // キャレットの絶対座標を取得
    const coords = view.coordsAtPos(from);
    
    // 現在の座標が含まれる .page-inner 要素を探す
    // getBoundingClientRect().left は .page-inner の左端（padding含む外枠）
    // 本文の開始位置は padding (17mm) を考慮する必要がある
    const pageInner = view.dom.querySelector('.page-inner');
    if (!pageInner) {
        return { relX: 0, originX: 0 };
    }
    
    const rect = pageInner.getBoundingClientRect();
    const style = window.getComputedStyle(pageInner);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    
    // 本文の開始位置（余白の内側）
    const originX = rect.left + paddingLeft;
    
    // 本文開始位置からの相対位置
    const relX = coords.left - originX;
    
    return { relX, originX };
}

/**
 * 次のタブ位置までの距離を計算
 * @param relX 本文開始位置からの相対座標
 */
function calculateTabWidth(relX: number): number {
    const step = INDENT_STEP_PX;
    
    // 浮動小数点の誤差を考慮してわずかに足してから計算
    // これにより、48.0001px のような位置でも 96px へのスナップを防ぐ
    const currentStep = Math.floor((relX + 0.01) / step);
    const targetRelX = (currentStep + 1) * step;
    
    let delta = targetRelX - relX;
    
    // 最小でも 1px 以上の幅を確保（重なり防止）
    if (delta < 1) {
        delta = step;
    }
    
    return delta;
}

export const InlineTab = Node.create({
    name: 'inlineTab',
    
    group: 'inline',
    
    inline: true,
    
    atom: true,
    
    addAttributes() {
        return {
            width: {
                default: INDENT_STEP_PX,
                parseHTML: element => {
                    const width = element.style.width;
                    return width ? parseFloat(width) : INDENT_STEP_PX;
                },
                renderHTML: attributes => {
                    return {
                        style: `width: ${attributes.width}px`,
                    };
                },
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'span.inline-tab',
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(
                { 
                    class: 'inline-tab',
                    'aria-hidden': 'true',
                },
                HTMLAttributes
            ),
        ];
    },
    
    addKeyboardShortcuts() {
        return {
            // Tabキー: インラインタブを挿入
            'Tab': ({ editor }) => {
                // 本文開始位置からの座標を取得
                const { relX } = getTabCalculationInfo(editor);
                const width = calculateTabWidth(relX);
                
                if (width <= 0) return false;
                
                // インラインタブを挿入
                editor
                    .chain()
                    .focus()
                    .insertContent({
                        type: this.name,
                        attrs: { width },
                    })
                    .run();
                
                return true;
            },
            
            // Backspace: 直前がinline-tabなら削除
            'Backspace': ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                
                // 選択範囲がある場合は通常のBackspace処理に任せる
                if (!selection.empty) {
                    return false;
                }
                
                const { $from } = selection;
                
                // キャレット直前のノードを確認
                const nodeBefore = $from.nodeBefore;
                
                // 直前がinline-tabの場合のみ削除
                if (nodeBefore?.type.name === this.name) {
                    // 直前のノードを削除
                    const from = $from.pos - nodeBefore.nodeSize;
                    const to = $from.pos;
                    
                    editor
                        .chain()
                        .focus()
                        .deleteRange({ from, to })
                        .run();
                    
                    return true;
                }
                
                // inline-tabでない場合は通常のBackspace処理
                return false;
            },
        };
    },
});
