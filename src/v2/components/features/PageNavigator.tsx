import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';
import { usePageThumbnails } from '@/hooks/usePageThumbnails';
import { PanelsTopLeft } from 'lucide-react';

interface PageNavigatorProps {
    editor: Editor;
}

/**
 * ページナビゲーターコンポーネント
 * 
 * 【重要】DOM操作はusePageThumbnailsフックに委譲し、
 * コンポーネント内では直接DOM操作を行わない
 */
export const PageNavigator: React.FC<PageNavigatorProps> = ({ editor }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();
    const navigatorRef = useRef<HTMLDivElement>(null);
    
    // DOM操作はフックに委譲
    usePageThumbnails(editor, navigatorRef, isSidebarOpen);

    return (
        <div 
            className={`flex flex-col h-full bg-[#e0e0e0] border-r border-gray-300 transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-[200px]' : 'w-0 overflow-hidden'}`}
        >
            <div 
                ref={navigatorRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-300 pt-6"
            >
                {/* Thumbnails injected by usePageThumbnails hook */}
            </div>

            {/* Sidebar toggle button */}
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
