import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '../store/useAppStore';
import { PanelsTopLeft } from 'lucide-react';

interface PageNavigatorProps {
    editor: Editor;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({ editor }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();
    const [activePageIndex, setActivePageIndex] = useState<number>(0);

    // Rebuild thumbnails on content change
    useEffect(() => {
        const navigator = document.getElementById('page-navigator-container');
        const pagesContainer = document.getElementById('pages-container');

        if (!navigator || !pagesContainer) return;

        const updateNavigator = () => {
            if (!isSidebarOpen) return;

            navigator.innerHTML = '';
            const pages = pagesContainer.querySelectorAll('section.page');

            pages.forEach((page, index) => {
                const pageNum = index + 1;
                
                // Thumbnail container
                const thumb = document.createElement('div');
                thumb.className = `relative mb-6 cursor-pointer group transition-all duration-200 transform hover:scale-[1.02]`;
                if (index === activePageIndex) {
                    thumb.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2', 'rounded-sm');
                } else {
                    thumb.classList.add('opacity-80', 'hover:opacity-100');
                }

                // Miniature page (scaled down)
                const miniature = document.createElement('div');
                miniature.className = "bg-white shadow-md border border-gray-200 origin-top overflow-hidden select-none pointer-events-none";
                miniature.style.width = '180px';
                miniature.style.height = '254px'; // Approx A4 aspect
                
                const inner = page.querySelector('.page-inner');
                if (inner) {
                    const clone = inner.cloneNode(true) as HTMLElement;
                    clone.removeAttribute('contenteditable');
                    clone.style.transform = 'scale(0.2)';
                    clone.style.transformOrigin = 'top left';
                    clone.style.width = '210mm';
                    clone.style.height = '297mm';
                    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                    miniature.appendChild(clone);
                }

                // Page number badge
                const label = document.createElement('div');
                label.className = "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded";
                label.textContent = `PAGE ${pageNum}`;

                thumb.appendChild(miniature);
                thumb.appendChild(label);

                thumb.onclick = () => {
                    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActivePageIndex(index);
                };

                navigator.appendChild(thumb);
            });
        };

        const domObserver = new MutationObserver((mutations) => {
            const shouldUpdate = mutations.some(m => m.type === 'childList' || m.type === 'characterData');
            if (shouldUpdate) updateNavigator();
        });

        domObserver.observe(pagesContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });

        updateNavigator();
        return () => domObserver.disconnect();
    }, [editor, isSidebarOpen, activePageIndex]);

    // Track active page on scroll
    useEffect(() => {
        const pagesContainer = document.getElementById('pages-container');
        if (!pagesContainer) return;

        const observer = new IntersectionObserver((entries) => {
            let maxRatio = 0;
            let maxIndex = -1;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    const pages = Array.from(pagesContainer.querySelectorAll('section.page'));
                    maxIndex = pages.indexOf(entry.target as HTMLElement);
                }
            });

            if (maxIndex !== -1) setActivePageIndex(maxIndex);
        }, { threshold: [0.1, 0.5] });

        const initObserver = () => {
            pagesContainer.querySelectorAll('section.page').forEach(page => observer.observe(page));
        };

        initObserver();

        const pageMutation = new MutationObserver(() => {
            observer.disconnect();
            initObserver();
        });
        pageMutation.observe(pagesContainer, { childList: true });

        return () => {
            observer.disconnect();
            pageMutation.disconnect();
        };
    }, [editor]);

    return (
        <div 
            className={`flex flex-col h-full bg-[#f8f9fa] border-r border-gray-200 transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-[240px]' : 'w-0 overflow-hidden'}`}
        >
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-2">
                <PanelsTopLeft className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-gray-700">ページ一覧</span>
            </div>
            
            <div 
                id="page-navigator-container" 
                className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-thin scrollbar-thumb-gray-300"
            >
                {/* Thumbnails injected here */}
            </div>

            {/* Sidebar toggle button (floating) */}
            <button 
                onClick={toggleSidebar}
                className={`absolute top-4 -right-10 w-8 h-8 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all z-[100] ${isSidebarOpen ? 'rotate-0' : 'rotate-180 translate-x-2'}`}
                title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
            >
                <PanelsTopLeft className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
};
