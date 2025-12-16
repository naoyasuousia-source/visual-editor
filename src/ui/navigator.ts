import { getPagesContainerElement } from '../globals.js';

let isNavigatorVisible = true;
let mutationObserver: MutationObserver | null = null;
let contentObserver: MutationObserver | null = null;

export function updateNavigator(): void {
    if (!isNavigatorVisible) return;

    const navigator = document.getElementById('page-navigator');
    const pagesContainer = getPagesContainerElement();
    if (!navigator || !pagesContainer) return;

    // Preserve scroll position logic could be added here if needed

    // Rebuild thumbnails (Simple rebuild is safest for index sync)
    navigator.innerHTML = '';

    const pages = pagesContainer.querySelectorAll<HTMLElement>('section.page');
    pages.forEach((page, index) => {
        const pageNum = index + 1;

        const thumb = document.createElement('div');
        thumb.className = 'nav-thumbnail';
        thumb.dataset.pageTarget = String(pageNum);
        if (page.classList.contains('active')) {
            thumb.classList.add('active');
        }

        // --- Visual Thumbnail Content ---
        const miniature = document.createElement('div');
        miniature.className = 'miniature-page';

        const inner = page.querySelector<HTMLElement>('.page-inner');
        if (inner) {
            const clone = inner.cloneNode(true) as HTMLElement;
            // Remove IDs to avoid duplicates in DOM
            const cachedParams = [];
            const elementsWithId = clone.querySelectorAll('[id]');
            elementsWithId.forEach(el => el.removeAttribute('id'));

            // Should potentiall remove contenteditable
            clone.contentEditable = 'false';

            miniature.appendChild(clone);
        }

        thumb.appendChild(miniature);
        // --------------------------------

        const label = document.createElement('div');
        label.className = 'nav-thumbnail-number';
        label.textContent = String(pageNum);

        thumb.appendChild(label);

        thumb.addEventListener('click', () => {
            page.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const inner = page.querySelector<HTMLElement>('.page-inner');
            if (inner) {
                if (window.setActiveEditor) window.setActiveEditor(inner);
            }
        });

        navigator.appendChild(thumb);
    });
}

function updateThumbnailContent(pageIndex: number): void {
    if (!isNavigatorVisible) return;
    const navigator = document.getElementById('page-navigator');
    const pagesContainer = getPagesContainerElement();
    if (!navigator || !pagesContainer) return;

    const page = pagesContainer.querySelectorAll('section.page')[pageIndex] as HTMLElement;
    const thumb = navigator.children[pageIndex] as HTMLElement;

    if (page && thumb) {
        const miniature = thumb.querySelector('.miniature-page');
        if (miniature) {
            miniature.innerHTML = '';
            const inner = page.querySelector<HTMLElement>('.page-inner');
            if (inner) {
                const clone = inner.cloneNode(true) as HTMLElement;
                const elementsWithId = clone.querySelectorAll('[id]');
                elementsWithId.forEach(el => el.removeAttribute('id'));
                clone.contentEditable = 'false';
                miniature.appendChild(clone);
            }
        }
    }
}

export function initNavigator(): void {
    updateNavigator();

    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer) return;

    // Observer for DOM structure changes (page add/remove)
    mutationObserver = new MutationObserver((mutations) => {
        let shouldFullRebuild = false;

        mutations.forEach(m => {
            if (m.type === 'childList') {
                // Check if direct child of pagesContainer (i.e. section.page added/removed)
                // or if it's deeper.
                if (m.target === pagesContainer) {
                    shouldFullRebuild = true;
                } else {
                    // Content change within a page
                    // Find which page changed
                    const target = m.target as Node;
                    const parent = target.nodeType === Node.ELEMENT_NODE ? target as Element : target.parentElement;
                    const page = parent?.closest('section.page');
                    if (page) {
                        // Optimize: Update only that thumbnail?
                        // Getting index...
                        const pages = Array.from(pagesContainer.children);
                        const index = pages.indexOf(page);
                        if (index >= 0) {
                            updateThumbnailContent(index);
                        }
                    }
                }

            } else if (m.type === 'attributes' && m.attributeName === 'class') {
                updateNavigatorActiveState();
            } else if (m.type === 'characterData') {
                // Text changed
                const target = m.target;
                const page = target.parentElement?.closest('section.page');
                if (page) {
                    const pages = Array.from(pagesContainer.children);
                    const index = pages.indexOf(page);
                    if (index >= 0) {
                        updateThumbnailContent(index);
                    }
                }
            }
        });

        if (shouldFullRebuild) {
            updateNavigator();
        }
    });

    mutationObserver.observe(pagesContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
        characterData: true
    });
}

function updateNavigatorActiveState(): void {
    const navigator = document.getElementById('page-navigator');
    const pagesContainer = getPagesContainerElement();
    if (!navigator || !pagesContainer) return;

    const pages = pagesContainer.querySelectorAll('section.page');
    // Force rebuild if length mismatch? No, just safe index access.
    const thumbnails = navigator.querySelectorAll('.nav-thumbnail');

    pages.forEach((page, index) => {
        const thumb = thumbnails[index];
        if (!thumb) return;
        if (page.classList.contains('active')) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

export function initParagraphJump(): void {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
            e.preventDefault();
            const dialog = document.getElementById('paragraph-jump-dialog') as HTMLDialogElement;
            const input = document.getElementById('paragraph-jump-input') as HTMLInputElement;
            if (dialog && input) {
                input.value = '';
                dialog.showModal();
            }
        }
    });

    const dialog = document.getElementById('paragraph-jump-dialog') as HTMLDialogElement;
    if (dialog) {
        dialog.addEventListener('close', () => {
            if (dialog.returnValue === 'go') {
                const input = document.getElementById('paragraph-jump-input') as HTMLInputElement;
                if (input && input.value) {
                    jumpToParagraph(input.value);
                }
            }
        });

        const goBtn = dialog.querySelector('button[value="go"]');
        if (goBtn) {
            goBtn.addEventListener('click', (e) => {
                e.preventDefault();
                dialog.close('go');
            });
        }
        const cancelBtn = dialog.querySelector('button[value="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                dialog.close('cancel');
            });
        }
    }
}

export function initSidebarToggle(): void {
    const btn = document.getElementById('sidebar-toggle-btn');
    const nav = document.getElementById('page-navigator');
    if (btn && nav) {
        btn.addEventListener('click', () => {
            const isCollapsed = nav.classList.toggle('collapsed');
            isNavigatorVisible = !isCollapsed; // Toggle visibility state
            btn.textContent = isCollapsed ? 'Thumbnail: OFF' : 'Thumbnail: ON';

            if (isNavigatorVisible) {
                updateNavigator(); // Re-render when opened to ensure fresh content
            }
        });
    }
}

export function initToolbarJump(): void {
    const input = document.getElementById('toolbar-jump-input') as HTMLInputElement;
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (input.value) {
                    jumpToParagraph(input.value);
                    input.value = '';
                }
            }
        });
    }
}

function jumpToParagraph(idStr: string): void {
    let targetId = idStr.trim();
    if (/^\d+-\d+$/.test(targetId)) {
        targetId = 'p' + targetId;
    }

    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.getAttribute('contenteditable') === 'true' || target.isContentEditable) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
            target.focus();
        } else {
            target.focus();
        }
    } else {
        alert('指定された段落が見つかりません: ' + targetId);
    }
}
