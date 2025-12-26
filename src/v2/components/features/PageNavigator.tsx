import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';
import { PanelsTopLeft } from 'lucide-react';

interface PageNavigatorProps {
    editor: Editor;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({ editor }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();
    const [activePageIndex, setActivePageIndex] = useState<number>(0);
    const navigatorRef = useRef<HTMLDivElement>(null);
    const isJumpingRef = useRef<boolean>(false);

    // Rebuild thumbnails on content change
    useEffect(() => {
        if (!navigatorRef.current || !isSidebarOpen) return;

        const updateNavigator = () => {
            if (!navigatorRef.current || !isSidebarOpen) return;

            const navigator = navigatorRef.current;
            navigator.innerHTML = '';
            
            // Use editor.view.dom instead of document.getElementById
            const editorElement = editor.view.dom as HTMLElement;
            const pages = editorElement.querySelectorAll('section.page');

            pages.forEach((page, index) => {
                const pageNum = index + 1;
                
                // Thumbnail container
                const thumb = document.createElement('div');
                thumb.className = `relative mb-6 cursor-pointer group transition-all duration-200 transform hover:scale-[1.02]`;
                // Miniature page (scaled down)
                const miniature = document.createElement('div');
                miniature.className = "bg-white shadow-sm border border-gray-200 origin-top overflow-hidden select-none pointer-events-none w-[160px] h-[226px] transition-all duration-200 relative";
                
                if (index === activePageIndex) {
                    miniature.className += ' ring-4 ring-blue-400 ring-offset-1 rounded-sm';
                }

                // Clone the WHOLE page element (section.page) to get a perfect miniature
                const clone = page.cloneNode(true) as HTMLElement;
                clone.removeAttribute('contenteditable');
                
                // Force layout properties to match the editor exactly
                // We use inline styles to override any Tailwind or CSS constraints
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
                    transform: 'scale(0.2016)', // 160 / (210 * 3.78)
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                });

                // Prevent internal scrollbars in the thumbnail
                const inner = clone.querySelector('.page-inner') as HTMLElement;
                if (inner) {
                    inner.style.overflow = 'hidden';
                    inner.style.height = '100%'; // Ensure it fills the clone
                }

                clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                miniature.appendChild(clone);

                thumb.appendChild(miniature);

                thumb.onclick = () => {
                    // ジャンプ中フラグをONにして、IntersectionObserverの更新を一時無効化
                    isJumpingRef.current = true;
                    setActivePageIndex(index);
                    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // スクロール完了後にフラグをOFF（smooth scrollの完了を待つ）
                    setTimeout(() => {
                        isJumpingRef.current = false;
                    }, 600);
                };

                navigator.appendChild(thumb);
            });
        };

        // Use MutationObserver on editor.view.dom
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
    }, [editor, isSidebarOpen, activePageIndex]);

    // Track active page on scroll
    useEffect(() => {
        const editorElement = editor.view.dom as HTMLElement;
        if (!editorElement) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        let pendingIndex: number = -1;

        const observer = new IntersectionObserver((entries) => {
            // ジャンプ中はスクロール追跡をスキップ
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
                
                // デバウンス: 連続したスクロールでの往復を防ぐ
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
        };
    }, [editor]);

    return (
        <div 
            className={`flex flex-col h-full bg-[#e0e0e0] border-r border-gray-300 transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-[200px]' : 'w-0 overflow-hidden'}`}
        >
            <div 
                ref={navigatorRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-300 pt-6"
            >
                {/* Thumbnails injected here */}
            </div>

            {/* Sidebar toggle button (Fixed at bottom left like original) */}
            <div className={`fixed bottom-4 left-4 z-[100] transition-all duration-300`}>
                <button 
                    onClick={toggleSidebar}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded shadow text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                    <PanelsTopLeft className="w-3 h-3" />
                    {isSidebarOpen ? 'サムネイル: 非表示' : 'サムネイル: 表示'}
                </button>
            </div>
        </div>
    );
};
