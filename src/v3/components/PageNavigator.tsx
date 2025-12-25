import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

interface PageNavigatorProps {
    editor: Editor;
}

import { useAppStore } from '../store/useAppStore';

export const PageNavigator: React.FC<PageNavigatorProps> = ({ editor }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();
    const [activePageIndex, setActivePageIndex] = useState<number>(0);

    // This effect handles the initial render and mutations to build the navigator structure
    useEffect(() => {
        const navigator = document.getElementById('page-navigator');
        const pagesContainer = document.getElementById('pages-container');

        if (!navigator || !pagesContainer) return;

        const updateNavigator = () => {
            if (!isSidebarOpen) {
                // If closed, strictly maybe we don't update? 
                // But we should consider clearing it or keeping it?
                // Original logic returned. CSS hides it.
                return;
            }

            // Simple rebuild for now (can be optimized later if performance issues arise)
            navigator.innerHTML = '';

            const pages = pagesContainer.querySelectorAll('section.page');

            pages.forEach((page, index) => {
                const pageNum = index + 1;
                const thumb = document.createElement('div');
                thumb.className = 'nav-thumbnail';
                if (index === activePageIndex) {
                    thumb.classList.add('active');
                }
                thumb.dataset.pageTarget = String(pageNum);

                const miniature = document.createElement('div');
                miniature.className = 'miniature-page';

                const inner = page.querySelector('.page-inner');
                if (inner) {
                    const clone = inner.cloneNode(true) as HTMLElement;
                    clone.removeAttribute('contenteditable');
                    // Remove IDs to avoid duplication and conflicts
                    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                    miniature.appendChild(clone);
                }

                const label = document.createElement('div');
                label.className = 'nav-thumbnail-number';
                label.textContent = String(pageNum);

                thumb.appendChild(miniature);
                thumb.appendChild(label);

                thumb.onclick = () => {
                    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update active index immediately on click for responsiveness
                    setActivePageIndex(index);
                };

                navigator.appendChild(thumb);
            });
        };

        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    shouldUpdate = true;
                } else if (mutation.type === 'characterData') {
                    shouldUpdate = true;
                }
            }
            if (shouldUpdate) {
                updateNavigator();
            }
        });

        observer.observe(pagesContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Initial update
        updateNavigator();

        return () => observer.disconnect();
    }, [editor, isSidebarOpen, activePageIndex]); // Re-run when activePageIndex changes to update classes

    // This effect handles scrolling to detect the active page
    useEffect(() => {
        const pagesContainer = document.getElementById('pages-container');
        if (!pagesContainer) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Find the index of the intersecting page
                    const pages = Array.from(pagesContainer.querySelectorAll('section.page'));
                    const index = pages.indexOf(entry.target as HTMLElement);
                    if (index !== -1) {
                        // We might have multiple intersecting, but usually we want one "primary" one.
                        // For simplicity, just set the LAST one that reports intersecting as active? 
                        // Or better, check intersectionRatio.
                        if (entry.intersectionRatio > 0.5) {
                            setActivePageIndex(index);
                        }
                    }
                }
            });
        }, {
            root: null, // viewport
            threshold: [0.1, 0.5, 0.9] // Check at multiple thresholds
        });

        const pages = pagesContainer.querySelectorAll('section.page');
        pages.forEach(page => observer.observe(page));

        return () => observer.disconnect();
    }, [editor]); // Re-attach if editor changes (though pages might change dynamically, handled partially)

    // We might need to re-observe if pages are added/removed. 
    // The MutationObserver above handles the Visual updates, but the scroll observer needs to track new nodes.
    // Combining them might be tricky. 
    // Let's rely on a separate Effect that listens to mutations to Re-Observe.

    useEffect(() => {
        const pagesContainer = document.getElementById('pages-container');
        if (!pagesContainer) return;

        let observer: IntersectionObserver;

        const initObserver = () => {
            observer = new IntersectionObserver((entries) => {
                // Find the visible page with highest intersection ratio
                let maxRatio = 0;
                let maxIndex = -1;

                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                        maxRatio = entry.intersectionRatio;
                        const pages = Array.from(pagesContainer.querySelectorAll('section.page'));
                        maxIndex = pages.indexOf(entry.target as HTMLElement);
                    }
                });

                if (maxIndex !== -1) {
                    setActivePageIndex(maxIndex);
                }
            }, {
                threshold: [0.1, 0.5]
            });

            const pages = pagesContainer.querySelectorAll('section.page');
            pages.forEach(page => observer.observe(page));
        };

        initObserver();

        const domObserver = new MutationObserver((mutations) => {
            // If pages added/removed, re-init intersection observer
            const hasPageChanges = mutations.some(m =>
                m.type === 'childList' &&
                Array.from(m.addedNodes).some(n => (n as HTMLElement).classList?.contains('page')) ||
                Array.from(m.removedNodes).some(n => (n as HTMLElement).classList?.contains('page'))
            );

            if (hasPageChanges) {
                observer.disconnect();
                initObserver();
            }
        });

        domObserver.observe(pagesContainer, { childList: true });

        return () => {
            observer.disconnect();
            domObserver.disconnect();
        };

    }, [editor]);


    return (
        <>
            <div id="page-navigator" className={!isSidebarOpen ? 'collapsed' : ''}></div>
            <div id="sidebar-toggle-overlay">
                <button id="sidebar-toggle-btn" onClick={toggleSidebar}>
                    {isSidebarOpen ? 'サムネイル：表示' : 'サムネイル：非表示'}
                </button>
            </div>
        </>
    );
};
