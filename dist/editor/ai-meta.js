import { getPagesContainerElement } from '../globals.js';
export function updateAiMetaGuide() {
    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer)
        return;
    let metaGuide = document.getElementById('ai-meta-guide');
    if (!metaGuide) {
        metaGuide = document.createElement('div');
        metaGuide.id = 'ai-meta-guide';
        metaGuide.style.display = 'none';
        // Insert at the top of pages container
        pagesContainer.insertBefore(metaGuide, pagesContainer.firstChild);
    }
    // AIへのインストラクションを記述
    // ここでは単純なテキストとして、このエディタの構造を説明する
    const guideText = `
<!-- AI ASSISTANT GUIDE
This HTML structure represents a paginated document.
- <section class="page"> represents a physical A4 page.
- .page-inner contains the editable content.
- Paragraphs have IDs like "p1-1" (Page 1, Paragraph 1).
- Images and figure metadata are stored in #ai-image-index at the bottom.
Use the IDs to locate specific paragraphs when assisting the user.
-->
`;
    metaGuide.innerHTML = guideText;
}
