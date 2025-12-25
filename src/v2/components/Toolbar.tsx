import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    Strikethrough, 
    Superscript as SuperscriptIcon, 
    Subscript as SubscriptIcon,
    Plus,
    Minus,
    Search,
    HelpCircle,
    Heart,
    ChevronDown,
    LayoutDashboard,
    FileType
} from 'lucide-react';
import { toast } from 'sonner';
import { FileMenu } from './menus/FileMenu';
import { ParagraphMenu } from './menus/ParagraphMenu';
import { FontMenu } from './menus/FontMenu';
import { HighlightMenu } from './menus/HighlightMenu';
import { useAppStore } from '../store/useAppStore';

interface ToolbarProps {
    editor: Editor | null;
    onAddPage?: () => void;
    onRemovePage?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    editor,
    onAddPage,
    onRemovePage,
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

    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    if (!editor) return null;

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
    const toggleStrike = () => editor.chain().focus().toggleStrike().run();
    const toggleSuperscript = () => editor.chain().focus().toggleSuperscript().run();
    const toggleSubscript = () => editor.chain().focus().toggleSubscript().run();

    const closeAllMenus = () => setActiveMenu(null);
    const toggleMenu = (menu: string) => setActiveMenu(activeMenu === menu ? null : menu);

    const btnBase = "p-1.5 rounded hover:bg-gray-200 transition-colors border border-transparent flex items-center justify-center min-w-[32px] h-[32px]";
    const btnActive = "bg-gray-200 border-gray-300 shadow-inner";
    const dropdownTrigger = "px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]";

    return (
        <div className="sticky top-0 w-full z-50 bg-[#f8f9fa] border-b border-gray-300 shadow-sm p-2 flex items-center gap-2 flex-wrap">
            {/* Logo */}
            <div className="flex items-center mr-2 select-none pointer-events-none">
                <img src="/image/logo-himawari.png" alt="Logo" className="h-8 w-auto object-contain rounded filter drop-shadow-sm" />
            </div>

            {/* File Menu */}
            <div className="relative">
                <FileMenu
                    isOpen={activeMenu === 'file'}
                    onToggle={() => toggleMenu('file')}
                    onClose={closeAllMenus}
                    editor={editor}
                />
            </div>

            {/* View Menu */}
            {!isWordMode && (
                <div className="relative">
                    <button
                        type="button"
                        className={dropdownTrigger}
                        onClick={() => toggleMenu('view')}
                    >
                        表示 <ChevronDown className="w-3 h-3" />
                    </button>
                    {activeMenu === 'view' && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[160px] z-[2000]">
                            <label className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm gap-2">
                                <input type="checkbox" defaultChecked onChange={(e) => document.body.classList.toggle('hide-page-numbers', !e.target.checked)} />
                                ページ番号
                            </label>
                            <label className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm gap-2">
                                <input type="checkbox" defaultChecked onChange={(e) => document.body.classList.toggle('hide-para-numbers', !e.target.checked)} />
                                段落番号
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* Formatting */}
            <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-1">
                <button type="button" onClick={toggleBold} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`} title="太字"><Bold className="w-4 h-4" /></button>
                <button type="button" onClick={toggleItalic} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`} title="斜体"><Italic className="w-4 h-4" /></button>
                <button type="button" onClick={toggleUnderline} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`} title="下線"><UnderlineIcon className="w-4 h-4" /></button>
                <button type="button" onClick={toggleStrike} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`} title="打ち消し線"><Strikethrough className="w-4 h-4" /></button>
                <button type="button" onClick={toggleSuperscript} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('superscript') ? 'bg-gray-200' : ''}`} title="上付き文字"><SuperscriptIcon className="w-4 h-4" /></button>
                <button type="button" onClick={toggleSubscript} className={`${btnBase} bg-white border border-gray-300 ${editor.isActive('subscript') ? 'bg-gray-200' : ''}`} title="下付き文字"><SubscriptIcon className="w-4 h-4" /></button>
            </div>

            {/* Highlights (Standard Only) */}
            {!isWordMode && (
                <div className="relative ml-1">
                    <button type="button" className={`${btnBase} bg-[#fef08a] border border-[#fde047] hover:bg-[#fde047] ${activeMenu === 'highlight' ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => toggleMenu('highlight')} title="ハイライト">
                        <LayoutDashboard className="w-4 h-4 text-[#854d0e]" />
                    </button>
                    {activeMenu === 'highlight' && <div className="absolute top-full left-0 mt-1 z-[2000]"><HighlightMenu editor={editor} /></div>}
                </div>
            )}

            {/* Font & Paragraph (Standard Only) */}
            {!isWordMode && (
                <>
                    <div className="relative">
                        <button type="button" className={dropdownTrigger} onClick={() => toggleMenu('font')}>Font <ChevronDown className="w-3 h-3" /></button>
                        {activeMenu === 'font' && <div className="absolute top-full left-0 mt-1 z-[2000]"><FontMenu editor={editor} /></div>}
                    </div>
                    <div className="relative">
                        <button type="button" className={dropdownTrigger} onClick={() => toggleMenu('paragraph')}>段落スタイル <ChevronDown className="w-3 h-3" /></button>
                        {activeMenu === 'paragraph' && <div className="absolute top-full left-0 mt-1 z-[2000]"><ParagraphMenu editor={editor} /></div>}
                    </div>
                </>
            )}

            {/* Word Mode Controls */}
            {isWordMode && (
                <>
                    <div className="flex items-center gap-2 border-r border-gray-300 pr-2 mr-1">
                         <label className="flex items-center hover:bg-gray-100 cursor-pointer text-xs gap-1 px-2 py-1 rounded border border-gray-300 bg-white h-[32px]">
                            <input 
                                type="checkbox" 
                                defaultChecked 
                                onChange={(e) => document.body.classList.toggle('hide-para-numbers', !e.target.checked)} 
                            />
                            段落番号
                        </label>
                    </div>

                    <div className="relative">
                        <select
                            className="h-[32px] px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 outline-none cursor-pointer min-w-[100px]"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'p') editor.chain().focus().setParagraph().run();
                                else if (value.startsWith('h')) editor.chain().focus().toggleHeading({ level: parseInt(value.substring(1)) as any }).run();
                                else if (value === 'h6') editor.chain().focus().toggleHeading({ level: 6 }).run();
                            }}
                            value={
                                editor.isActive('heading', { level: 1 }) ? 'h1' :
                                editor.isActive('heading', { level: 2 }) ? 'h2' :
                                editor.isActive('heading', { level: 3 }) ? 'h3' :
                                editor.isActive('heading', { level: 6 }) ? 'h6' :
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
                    <button type="button" onClick={onAddPage} className={`${btnBase} bg-white border border-gray-300`} title="ページ追加"><Plus className="w-4 h-4 text-gray-600" /></button>
                    <button type="button" onClick={onRemovePage} className={`${btnBase} bg-white border border-gray-300`} title="ページ削除"><Minus className="w-4 h-4 text-gray-600" /></button>
                </div>
            )}

            {/* Zoom */}
            <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden h-[32px] ml-1">
                <button type="button" onClick={zoomOut} className="px-2 hover:bg-gray-100 border-r border-gray-200 text-sm font-bold text-gray-600">-</button>
                <div className="px-2 text-xs font-semibold min-w-[36px] text-center select-none text-gray-700">{zoomLevel}%</div>
                <button type="button" onClick={zoomIn} className="px-2 hover:bg-gray-100 text-sm font-bold text-gray-600">+</button>
            </div>

            {/* Jump Widget */}
            <div className="flex items-center gap-1 ml-1 bg-white border border-gray-300 rounded px-2 h-[32px]">
                <Search className="w-3 h-3 text-gray-400" />
                <input
                    type="text"
                    className="text-xs outline-none w-32 placeholder-gray-400"
                    placeholder={isWordMode ? "例：15" : "例：1-1"}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = (e.currentTarget as HTMLInputElement).value;
                            if (!target) return;
                            let targetId = target;
                            if (!isWordMode && /^\d+-\d+$/.test(target)) targetId = 'p' + target;
                            else if (isWordMode && /^\d+$/.test(target)) targetId = 'p' + target;
                            
                            const element = document.getElementById(targetId);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                toast.success(`${target} へジャンプしました`);
                            } else if (window.find && window.find(target)) {
                                toast.success(`"${target}" が見つかりました`);
                            } else {
                                toast.error('見つかりませんでした');
                            }
                        }
                    }}
                />
                <span className="text-[10px] text-gray-400 whitespace-nowrap hidden sm:inline">[Ctrl+J]</span>
            </div>

            {/* Right Group */}
            <div className="ml-auto flex items-center gap-2">
                <button 
                    type="button" 
                    onClick={toggleWordMode}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all h-[32px] flex items-center gap-1 shadow-sm ${
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
                    onClick={() => { closeAllMenus(); openDialog('donate'); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#fff0b3] border border-[#ffe066] text-[#b37400] text-xs font-bold hover:bg-[#ffe680] transition-all h-[32px] shadow-sm ml-1"
                >
                    <Heart className="w-3.5 h-3.5 fill-[#f59f00] text-[#f59f00]" />
                    <span>開発を応援</span>
                </button>
                
                <button 
                    type="button" 
                    onClick={() => { closeAllMenus(); openDialog('help'); }}
                    className="p-1.5 rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors shadow-sm ml-1"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
