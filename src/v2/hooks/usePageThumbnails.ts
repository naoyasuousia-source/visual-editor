import { useEffect, useRef, useState, RefObject } from 'react';
import { Editor } from '@tiptap/react';

interface ThumbnailConfig {
    pageElement: Element;
    index: number;
    isActive: boolean;
}

/**
 * ページナビゲーターのサムネイル管理フック
 * 
 * 【重要】DOM操作をフック内にカプセル化し、コンポーネントからの直接DOM操作を排除
 */
export const usePageThumbnails = (
    editor: Editor | null,
    navigatorRef: RefObject<HTMLDivElement>,
    isSidebarOpen: boolean
) => {
    const [activePageIndex, setActivePageIndex] = useState<number>(0);
    const isJumpingRef = useRef<boolean>(false);

    // Rebuild thumbnails on content change
    useEffect(() => {
        if (!navigatorRef.current || !isSidebarOpen || !editor) return;

        const updateNavigator = () => {
            if (!navigatorRef.current || !isSidebarOpen) return;

            const navigator = navigatorRef.current;
            navigator.innerHTML = '';
            
            const editorElement = editor.view.dom as HTMLElement;
            const pages = editorElement.querySelectorAll('section.page');

            pages.forEach((page, index) => {
                // Thumbnail container
                const thumb = document.createElement('div');
                thumb.className = `relative mb-6 cursor-pointer group transition-all duration-200 transform hover:scale-[1.02]`;
                
                // Miniature page (scaled down)
                const miniature = document.createElement('div');
                miniature.className = "bg-white shadow-sm border border-gray-200 origin-top overflow-hidden select-none pointer-events-none w-[160px] h-[226px] transition-all duration-200 relative";
                
                if (index === activePageIndex) {
                    miniature.className += ' ring-4 ring-blue-400 ring-offset-1 rounded-sm';
                }

                // Clone the page element
                const clone = page.cloneNode(true) as HTMLElement;
                clone.removeAttribute('contenteditable');
                
                Object.assign(clone.style, {
                    width: '210mm',
                    height: '297mm',
                    minWidth: '210mm',
                    minHeight: '297mm',
                    margin: '0',
                    boxShadow: 'none',
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    transform: 'scale(0.2016)',
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                });

                const inner = clone.querySelector('.page-inner') as HTMLElement;
                if (inner) {
                    inner.style.overflow = 'hidden';
                    inner.style.height = '100%';
                }

                clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                miniature.appendChild(clone);
                thumb.appendChild(miniature);

                thumb.onclick = () => {
                    isJumpingRef.current = true;
                    setActivePageIndex(index);
                    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    setTimeout(() => {
                        isJumpingRef.current = false;
                    }, 600);
                };

                navigator.appendChild(thumb);
            });
        };

        const editorElement = editor.view.dom as HTMLElement;
        const domObserver = new MutationObserver((mutations) => {
            const shouldUpdate = mutations.some(m => m.type === 'childList' || m.type === 'characterData');
            if (shouldUpdate) updateNavigator();
        });

        domObserver.observe(editorElement, {
            childList: true,
            subtree: true,
            characterData: true
        });

        updateNavigator();
        return () => domObserver.disconnect();
    }, [editor, isSidebarOpen, activePageIndex, navigatorRef]);

    // Track active page on scroll
    useEffect(() => {
        if (!editor) return;
        
        const editorElement = editor.view.dom as HTMLElement;
        if (!editorElement) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        let pendingIndex: number = -1;

        const observer = new IntersectionObserver((entries) => {
            if (isJumpingRef.current) return;

            let maxRatio = 0;
            let maxIndex = -1;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    const pages = Array.from(editorElement.querySelectorAll('section.page'));
                    maxIndex = pages.indexOf(entry.target as HTMLElement);
                }
            });

            if (maxIndex !== -1 && maxIndex !== pendingIndex) {
                pendingIndex = maxIndex;
                
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    setActivePageIndex(pendingIndex);
                }, 100);
            }
        }, { threshold: [0.2, 0.4, 0.6] });

        const initObserver = () => {
            editorElement.querySelectorAll('section.page').forEach(page => observer.observe(page));
        };

        initObserver();

        const pageMutation = new MutationObserver(() => {
            observer.disconnect();
            initObserver();
        });
        pageMutation.observe(editorElement, { childList: true });

        return () => {
            observer.disconnect();
            pageMutation.disconnect();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [editor]);

    return {
        activePageIndex
    };
};
