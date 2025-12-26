import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';

interface SidebarProps {
    editor: Editor | null;
}

/**
 * Sidebar with Page Thumbnails
 * 
 * Based on v1's navigator.ts with MutationObserver for real-time updates.
 * Displays miniature page previews for quick navigation.
 */
export const Sidebar: React.FC<SidebarProps> = ({ editor }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();
    const [thumbnails, setThumbnails] = useState<Array<{ pageNum: number; isActive: boolean }>>([]);
    const observerRef = useRef<MutationObserver | null>(null);

    // Update thumbnails from editor DOM
    const updateThumbnails = () => {
        if (!editor) return;

        const editorElement = editor.view.dom as HTMLElement;
        const pages = editorElement.querySelectorAll<HTMLElement>('section.page');

        const newThumbnails = Array.from(pages).map((page, index) => ({
            pageNum: index + 1,
            isActive: page.classList.contains('active'),
        }));

        setThumbnails(newThumbnails);
    };

    // Setup MutationObserver for real-time updates (v1 approach)
    useEffect(() => {
        if (!editor || !isSidebarOpen) return;

        const editorElement = editor.view.dom as HTMLElement;
        updateThumbnails();

        // Create MutationObserver
        observerRef.current = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {
                // Check for page structure changes
                if (mutation.type === 'childList') {
                    const target = mutation.target as Element;
                    if (target.classList?.contains('ProseMirror') || 
                        target.closest('section.page')) {
                        shouldUpdate = true;
                    }
                }
                // Check for active class changes
                else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                updateThumbnails();
            }
        });

        // Observe editor for changes
        observerRef.current.observe(editorElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [editor, isSidebarOpen]);

    // Jump to page on thumbnail click
    const handleThumbnailClick = (pageNum: number) => {
        if (!editor) return;

        const editorElement = editor.view.dom as HTMLElement;
        const pages = editorElement.querySelectorAll<HTMLElement>('section.page');
        const targetPage = pages[pageNum - 1];

        if (targetPage) {
            targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Set active editor
            const inner = targetPage.querySelector<HTMLElement>('.page-inner');
            if (inner) {
                inner.focus();
            }
        }
    };

    if (!isSidebarOpen) {
        return (
            <button
                onClick={toggleSidebar}
                className="fixed left-4 top-20 z-10 rounded-md bg-white px-3 py-2 text-sm shadow-md hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="サイドバーを開く"
            >
                サムネイル表示
            </button>
        );
    }

    return (
        <aside className="fixed left-0 top-0 z-20 h-screen w-64 overflow-y-auto border-r border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">ページ一覧</h2>
                <button
                    onClick={toggleSidebar}
                    className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="サイドバーを閉じる"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-3">
                {thumbnails.map((thumb) => (
                    <div
                        key={thumb.pageNum}
                        onClick={() => handleThumbnailClick(thumb.pageNum)}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            thumb.isActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                    >
                        <div className="mb-2 text-center text-sm font-medium dark:text-white">
                            ページ {thumb.pageNum}
                        </div>
                        {/* Miniature preview placeholder - can be enhanced with actual page rendering */}
                        <div className="aspect-[210/297] rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </aside>
    );
};
