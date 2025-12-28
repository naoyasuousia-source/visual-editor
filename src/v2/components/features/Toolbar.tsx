import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
    FilePlus2,
    FileMinus2,
    HelpCircle,
    Heart,
    ChevronDown,
    FileType
} from 'lucide-react';
import { toast } from 'sonner';
import { FileMenu } from '@/components/common/toolbar/FileMenu';
import { ViewMenu } from '@/components/common/toolbar/ViewMenu';
import { ParagraphMenu } from '@/components/common/toolbar/ParagraphMenu';
import { FontMenu } from '@/components/common/toolbar/FontMenu';
import { HighlightMenu } from '@/components/common/toolbar/HighlightMenu';
import { useAppStore } from '@/store/useAppStore';
import { useJumpNavigation } from '@/hooks/useJumpNavigation';
import { useParagraphNumberToggle } from '@/hooks/useParagraphNumberToggle';
import { useTextFormatting } from '@/hooks/useTextFormatting';

interface ToolbarProps {
    editor: Editor | null;
    onAddPage?: () => void;
    onRemovePage?: () => void;
    prompt: (options: { 
        title: string; 
        description?: string; 
        placeholder?: string; 
        inputType?: 'text' | 'url' 
    }) => Promise<string | null>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    editor,
    onAddPage,
    onRemovePage,
    prompt,
}) => {
    const {
        zoomLevel,
        zoomIn,
        zoomOut,
        isWordMode,
        toggleWordMode,
        openDialog,
        isSidebarOpen,
        toggleSidebar
    } = useAppStore();

    const { toggleParagraphNumbers } = useParagraphNumberToggle();

    // Jump Navigation (ロジック分離)
    const { jumpTo } = useJumpNavigation(editor, isWordMode);

    // Text Formatting (ロジック分離)
    const {
        toggleBold,
        toggleItalic,
        toggleUnderline,
        toggleStrike,
        toggleSuperscript,
        toggleSubscript,
        toggleHeading,
        setParagraph,
        isActive
    } = useTextFormatting(editor);

    if (!editor) return null;

    const btnBase = "p-1.5 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center justify-center min-w-[36px] h-[36px]";
    const btnActive = "bg-gray-200 border-gray-300 shadow-inner";

    return (
        <div className="sticky top-0 w-full z-50 bg-[#f8f9fa] border-b border-gray-300 shadow-sm p-2 flex items-center gap-2 flex-wrap">
            {/* Logo */}
            <div className="flex items-center mr-2 select-none pointer-events-none">
                <img src="/image/logo-himawari.png" alt="Logo" className="h-8 w-auto object-contain rounded filter drop-shadow-sm" />
            </div>

            {/* File Menu */}
            <FileMenu editor={editor} prompt={prompt} />

            {/* View Menu */}
            {!isWordMode && <ViewMenu />}

            {/* Formatting Group - Flattened and Equally Spaced */}
            <div className="flex items-center gap-1.5 ml-1.5">
                <button type="button" onClick={toggleBold} className={`${btnBase} ${isActive('bold') ? 'bg-gray-200 shadow-inner' : ''}`} title="太字">
                    <span className="font-sans font-bold text-gray-700 text-base leading-none">B</span>
                </button>
                <button type="button" onClick={toggleItalic} className={`${btnBase} ${isActive('italic') ? 'bg-gray-200 shadow-inner' : ''}`} title="斜体">
                    <span className="italic font-serif text-gray-700 text-lg leading-none">I</span>
                </button>
                <button type="button" onClick={toggleUnderline} className={`${btnBase} ${isActive('underline') ? 'bg-gray-200 shadow-inner' : ''}`} title="下線">
                    <span className="underline font-serif text-gray-700 text-base leading-none decoration-gray-700 underline-offset-2">U</span>
                </button>
                <button type="button" onClick={toggleStrike} className={`${btnBase} ${isActive('strike') ? 'bg-gray-200 shadow-inner' : ''}`} title="打ち消し線">
                    <span className="line-through font-serif text-gray-700 text-base leading-none decoration-gray-700">S</span>
                </button>
                <button type="button" onClick={toggleSuperscript} className={`${btnBase} ${isActive('superscript') ? 'bg-gray-200 shadow-inner' : ''}`} title="上付き文字">
                    <span className="font-sans text-gray-700 text-sm flex items-start leading-none gap-[1px]">x <span className="text-[10px] -mt-1 font-bold">2</span></span>
                </button>
                <button type="button" onClick={toggleSubscript} className={`${btnBase} ${isActive('subscript') ? 'bg-gray-200 shadow-inner' : ''}`} title="下付き文字">
                    <span className="font-sans text-gray-700 text-sm flex items-end leading-none gap-[1px]">x <span className="text-[10px] -mb-1 font-bold">2</span></span>
                </button>
                
                {/* Highlight Menu - Radix UI版 */}
                <HighlightMenu editor={editor} />
            </div>

            {/* Font & Paragraph (Standard Only) */}
            {!isWordMode && (
                <>
                    <FontMenu editor={editor} />
                    <ParagraphMenu editor={editor} />
                </>
            )}

            {/* Word Mode Controls */}
            {isWordMode && (
                <>
                    <div className="flex items-center gap-2 border-r border-gray-300 pr-2 mr-1">
                         <label className="flex items-center hover:bg-gray-100 cursor-pointer text-xs gap-1 px-2 py-1 rounded border border-gray-300 bg-white h-[36px]">
                            <input 
                                type="checkbox" 
                                defaultChecked 
                                onChange={(e) => toggleParagraphNumbers(e.target.checked)} 
                            />
                            段落番号
                        </label>
                    </div>

                    <div className="relative">
                        <select
                            className="h-[36px] px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 outline-none cursor-pointer min-w-[100px]"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'p') setParagraph();
                                else if (value.startsWith('h')) {
                                    const level = parseInt(value.substring(1)) as 1 | 2 | 3 | 4 | 5 | 6;
                                    toggleHeading(level);
                                }
                            }}
                            value={
                                isActive('heading', { level: 1 }) ? 'h1' :
                                isActive('heading', { level: 2 }) ? 'h2' :
                                isActive('heading', { level: 3 }) ? 'h3' :
                                isActive('heading', { level: 6 }) ? 'h6' :
                                'p'
                            }
                        >
                            <option value="p">本文</option>
                            <option value="h1">見出し1</option>
                            <option value="h2">見出し2</option>
                            <option value="h3">見出し3</option>
                            <option value="h6">サブテキスト</option>
                        </select>
                    </div>
                </>
            )}

            {/* Page Controls (Standard Only) */}
            {!isWordMode && (
                <div className="flex items-center gap-1 ml-1">
                    <button type="button" onClick={onAddPage} className={btnBase} title="ページ追加">
                        <FilePlus2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button type="button" onClick={onRemovePage} className={btnBase} title="ページ削除">
                        <FileMinus2 className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            )}

            {/* Zoom */}
            <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden h-[36px] ml-1">
                <button type="button" onClick={zoomOut} className="px-2 hover:bg-gray-100 border-r border-gray-200 text-sm font-bold text-gray-600">-</button>
                <div className="px-2 text-xs font-semibold min-w-[36px] text-center select-none text-gray-700">{zoomLevel}%</div>
                <button type="button" onClick={zoomIn} className="px-2 hover:bg-gray-100 text-sm font-bold text-gray-600">+</button>
            </div>

            {/* Jump Widget */}
            <div className="flex items-center gap-2 ml-1 bg-white border border-gray-300 rounded px-2 h-[36px] min-w-[200px]">
                <div className="flex flex-col justify-center items-start leading-[0.8]">
                    <span className="text-[10px] text-gray-600 font-bold scale-[0.9] origin-left">ジャンプ機能</span>
                    <span className="text-[9px] text-gray-400 scale-[0.85] origin-left">[ ctrl+J ]</span>
                </div>
                <input
                    type="text"
                    className="text-xs outline-none w-full placeholder-gray-400"
                    placeholder={isWordMode ? "(例：15)…へジャンプ" : "(例：1-1)…へジャンプ"}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = (e.currentTarget as HTMLInputElement).value;
                            jumpTo(target);
                        }
                    }}
                />
            </div>

            {/* Right Group */}
            <div className="ml-auto flex items-center gap-2">
                <button 
                    type="button" 
                    onClick={toggleWordMode}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all h-[36px] flex items-center gap-1 shadow-sm ${
                        isWordMode 
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100' // Word Mode active -> Show "Switch to standard" (White)
                        : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] border border-transparent' // Standard Mode active -> Show "Switch to Word" (Blue)
                    }`}
                >
                    <FileType className="w-3.5 h-3.5" />
                    {isWordMode ? '標準モードに切替' : 'Word互換モードに切替'}
                </button>

                <button 
                    type="button" 
                    onClick={() => openDialog('donate')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#fff0b3] border border-[#ffe066] text-[#b37400] text-xs font-bold hover:bg-[#ffe680] transition-all h-[36px] shadow-sm ml-1"
                >
                    <Heart className="w-3.5 h-3.5 fill-[#f59f00] text-[#f59f00]" />
                    <span>開発を応援</span>
                </button>
                
                <button 
                    type="button" 
                    onClick={() => openDialog('help')}
                    className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors shadow-sm ml-1"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
