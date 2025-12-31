import React, { useState, useRef, useEffect } from 'react';
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
import { WordBlockMenu } from '@/components/common/toolbar/WordBlockMenu';
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
        toggleSidebar,
        shouldFocusJumpInput,
        resetJumpInputFocus
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

    // Jump Input Ref (Ctrl+J focus制御)
    const jumpInputRef = useRef<HTMLInputElement>(null);

    // Ctrl+Jでフォーカスを設定
    useEffect(() => {
        if (shouldFocusJumpInput && jumpInputRef.current) {
            jumpInputRef.current.focus();
            jumpInputRef.current.select();
            resetJumpInputFocus();
        }
    }, [shouldFocusJumpInput, resetJumpInputFocus]);

    if (!editor) return null;

    const btnBase = "p-1.5 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center justify-center min-w-[36px] h-[36px]";
    const btnActive = "bg-gray-200 border-gray-300 shadow-inner";

    return (
        <div className="sticky top-0 w-full z-50 bg-[#f8f9fa] border-b border-gray-300 shadow-sm p-2 flex items-center gap-2 flex-wrap">
            {/* Logo */}
            <div className="flex items-center mr-2 select-none pointer-events-none">
                <img src="image/logo-himawari.png" alt="Logo" className="h-8 w-auto object-contain rounded filter drop-shadow-sm" />
            </div>

            {/* File Menu */}
            <FileMenu editor={editor} prompt={prompt} />

            {/* Paragraph Number Toggle (常に表示、ファイルとBの間) */}
            <div className="flex items-center ml-1">
                <label className="flex items-center hover:bg-gray-100 cursor-pointer text-xs gap-1 px-2 py-1 rounded border border-gray-300 bg-white h-[36px] select-none">
                    <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={(e) => toggleParagraphNumbers(e.target.checked)} 
                        className="w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-700">段落番号</span>
                </label>
            </div>

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
                
                {/* Highlight Menu - Radix UI版 (Wordモードでは非表示) */}
                {!isWordMode && <HighlightMenu editor={editor} />}
            </div>

            {/* Font & Paragraph (Standard Only) */}
            {!isWordMode && (
                <>
                    <FontMenu editor={editor} />
                    <ParagraphMenu editor={editor} />
                </>
            )}

            {/* Word Mode Controls */}
            {isWordMode && <WordBlockMenu editor={editor} />}

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

            {/* Jump Widget - v1準拠の二段構造（フォント1.3倍、幅0.7倍） */}
            <div className="flex flex-col justify-center items-start ml-2 bg-white border border-gray-300 rounded px-1.5 h-[36px] w-[154px] box-border">
                <label
                    htmlFor={isWordMode ? 'toolbar-jump-input-word' : 'toolbar-jump-input'}
                    className="text-gray-400 cursor-text leading-[0.8] text-[9.1pt] tracking-tight mt-0.5"
                >
                    ジャンプ機能　[ ctrl+J ]
                </label>
                <input
                    ref={jumpInputRef}
                    type="text"
                    id={isWordMode ? 'toolbar-jump-input-word' : 'toolbar-jump-input'}
                    className="w-full bg-transparent border-none outline-none text-black leading-[0.8] text-[10pt] font-normal tracking-tight p-0 placeholder:text-gray-400 placeholder:text-[9.1pt] placeholder:opacity-100"
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
                    className={`px-3 py-1 rounded text-xs transition-all h-[36px] flex items-center gap-1 shadow-sm font-black tracking-wider ${
                        isWordMode 
                        ? 'bg-gradient-to-br from-[#f39c12] to-[#d35400] text-white hover:brightness-110 !border-none [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]' // v1 Sunset Orange
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
