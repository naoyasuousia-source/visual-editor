
import { getPagesContainerElement } from '../globals.js';

export function updateNavigator(): void {
    const navigator = document.getElementById('page-navigator');
    const pagesContainer = getPagesContainerElement();
    if (!navigator || !pagesContainer) return;

    // Current page mapping
    // We want to preserve scroll position if possible? 
    // Rebuilding completely is easiest for synchronization.

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

        const label = document.createElement('div');
        label.className = 'nav-thumbnail-number';
        label.textContent = String(pageNum);

        thumb.appendChild(label);

        thumb.addEventListener('click', () => {
            page.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Optionally set active editor/focus?
            // Maybe focusing the first paragraph in that page
            const inner = page.querySelector<HTMLElement>('.page-inner');
            if (inner) {
                if (window.setActiveEditor) window.setActiveEditor(inner);
                // Don't necessarily focus, maybe just scroll. 
                // If user wants to edit, they click. Focus might jump scroll weirdly.
            }
        });

        navigator.appendChild(thumb);
    });
}

export function initNavigator(): void {
    // Initial call
    updateNavigator();

    // We might want to listen to scroll events to update 'active' thumbnail highlighting?
    // Current 'active' class on page depends on setActiveEditor which is called on interaction.
    // If we want scroll-spy behavior, we need an IntersectionObserver.

    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer) return;

    // Simple observer for active page visibility
    const observer = new IntersectionObserver((entries) => {
        // Find the page that is most visible
        // Actually, logic usually is 'first crossing threshold' or 'highest intersection ratio'.
        // Let's just update the highlight based on window.currentEditor mainly, 
        // but if we want scroll tracking:

        // entries.forEach(entry => {
        //    if (entry.isIntersecting) {
        //        // Highlighting corresponding thumbnail
        //    }
        // });

        // Ideally we sync 'active' class from DOM changes.
        // Since setActiveEditor adds 'active' class to section.page, 
        // we can just use MutationObserver on pagesContainer?

    }, { threshold: 0.5 });

    // pages.forEach(p => observer.observe(p));

    // Observer for DOM changes (page add/remove, active class change)
    // Actually updateNavigator is called manually on add/remove page.
    // We just need to handle 'active' class toggle.

    const mutationObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach(m => {
            if (m.type === 'childList') {
                shouldUpdate = true;
            } else if (m.type === 'attributes' && m.attributeName === 'class') {
                // Update active state visuals only
                updateNavigatorActiveState();
            }
        });
        if (shouldUpdate) {
            updateNavigator();
        }
    });

    mutationObserver.observe(pagesContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

function updateNavigatorActiveState(): void {
    const navigator = document.getElementById('page-navigator');
    const pagesContainer = getPagesContainerElement();
    if (!navigator || !pagesContainer) return;

    const pages = pagesContainer.querySelectorAll('section.page');
    const thumbnails = navigator.querySelectorAll('.nav-thumbnail');

    pages.forEach((page, index) => {
        const thumb = thumbnails[index];
        if (!thumb) return;
        if (page.classList.contains('active')) {
            thumb.classList.add('active');
            // Scroll navigator to show active thumbnail
            // thumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

        // Handle explicit button clicks if method="dialog" doesn't automatically set returnValue correct on all browsers?
        // Usually <button value="go"> works.
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
            btn.textContent = isCollapsed ? 'Thumbnail: OFF' : 'Thumbnail: ON';
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
                    input.value = ''; // Optional: clear after jump
                }
            }
        });
    }
}

function jumpToParagraph(idStr: string): void {
    // Parse "3-5" => "p3-5"
    // Or allow raw "p3-5"
    let targetId = idStr.trim();
    if (/^\d+-\d+$/.test(targetId)) {
        targetId = 'p' + targetId;
    }

    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Try to focus
        if (target.getAttribute('contenteditable') === 'true' || target.isContentEditable) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        } else {
            target.focus();
        }
    } else {
        alert('指定された段落が見つかりません: ' + targetId);
    }
}
