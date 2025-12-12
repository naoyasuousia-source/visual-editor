/**
 * 段落要素が空（テキストや<br>以外の要素がない）かどうかを判定します。
 * @param block - 判定対象の要素
 * @returns 空であれば true
 */
const isParagraphEmpty = (block) => {
    if (!block)
        return false;
    for (const child of block.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            // textContent が null の可能性を考慮し、オプショナルチェイニング(?.)を使用
            if (child.textContent?.trim() !== '') {
                return false;
            }
        }
        else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName !== 'BR') {
                return false;
            }
        }
    }
    return true;
};
// 段階的な移行のため、グローバルスコープで利用できるようにする
window.isParagraphEmpty = isParagraphEmpty;
// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
    console.log("initEditor() 呼ばれた！");
}
