// Basic file IO functions
// Import global state if needed, but for utility functions better to keep pure or pass args.
// Since `saveFullHTML` and `openWithFilePicker` rely heavily on global state and DOM,
// we might keep them in a higher level module or refactor to accept arguments.
// For now, let's move the logic that can be isolated.
export function buildFullHTML(pagesContainer, styleTag, isWordMode = false) {
    if (!pagesContainer)
        return '';
    // Clone to remove contenteditable/active classes
    const containerClone = pagesContainer.cloneNode(true);
    containerClone.querySelectorAll('.page-inner').forEach((pi) => {
        pi.removeAttribute('contenteditable');
        pi.removeAttribute('data-bound');
    });
    containerClone.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Remove selection markers or helper elements if any
    containerClone.querySelectorAll('.caret-slot').forEach(el => {
        const next = el.nextElementSibling;
        if (next && next.tagName === 'BR') {
            next.remove();
        }
        el.remove();
    });
    if (isWordMode) {
        containerClone.querySelectorAll('#ai-image-index').forEach(el => el.remove());
    }
    const styleContent = styleTag ? styleTag.innerHTML : '';
    const bodyClass = isWordMode ? ' class="mode-word"' : '';
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
${styleContent}
</style>
</head>
<body${bodyClass}>
<div id="pages-container">
${containerClone.innerHTML}
</div>
</body>
</html>`;
}
// Reading file content is generic
export function readTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result);
            }
            else {
                reject(new Error("Empty file"));
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}
