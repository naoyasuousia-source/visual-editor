import React from 'react';
import { useAppStore } from '@/components/../store/useAppStore';
import { HELP_CONTENT } from '@/components/../constants/help-info';
import { X, FileText } from 'lucide-react';

export const SubHelpDialog: React.FC = () => {
    const { subHelpData, closeSubHelp } = useAppStore();

    if (!subHelpData.isOpen) return null;

    const content = subHelpData.type ? HELP_CONTENT[subHelpData.type] : '';
    
    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeSubHelp}></div>
            
            {/* Dialog Content */}
            <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h1 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {subHelpData.type || '詳細情報'}
                    </h1>
                    <button 
                        type="button" 
                        className="p-1 px-2 rounded-lg hover:bg-gray-200 text-gray-400 text-sm flex items-center gap-1 transition-colors" 
                        onClick={closeSubHelp}
                    >
                        <X className="w-4 h-4" />
                        <span>閉じる</span>
                    </button>
                </div>

                {/* Body - Content from HELP_CONTENT */}
                <div 
                    className="p-8 max-h-[70vh] overflow-y-auto text-sm text-gray-600 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200"
                    dangerouslySetInnerHTML={{ 
                        __html: content || '<p class="text-center py-10 opacity-50">詳細情報は現在準備中です。</p>' 
                    }}
                />
            </div>
        </div>
    );
};
