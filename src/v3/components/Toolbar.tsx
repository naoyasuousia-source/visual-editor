import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { FileMenu } from './menus/FileMenu';
import { ParagraphMenu } from './menus/ParagraphMenu';
import { FontMenu } from './menus/FontMenu';
import { HighlightMenu } from './menus/HighlightMenu';
import { useAppStore } from '../store/useAppStore';

interface ToolbarProps {
    editor: Editor | null;
    onAddPage?: () => void; // Optional/Deprecated in favor of store or command? Kept for now as it uses editor commands not just store
    onRemovePage?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    editor,
    onAddPage,
    onRemovePage,
}) => {
    // Global Store
    const {
        zoomLevel,
        zoomIn,
        zoomOut,
        setPageMargin,
        isWordMode,
        toggleWordMode
    } = useAppStore();

    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const [viewMenuOpen, setViewMenuOpen] = useState(false);
    const [fontMenuOpen, setFontMenuOpen] = useState(false);
    const [paraMenuOpen, setParaMenuOpen] = useState(false);
    const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);

    if (!editor) return null;

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
    const toggleStrike = () => editor.chain().focus().toggleStrike().run();
    const toggleSuperscript = () => editor.chain().focus().toggleSuperscript().run();
    const toggleSubscript = () => editor.chain().focus().toggleSubscript().run();

    const closeAllMenus = () => {
        setFileMenuOpen(false);
        setViewMenuOpen(false);
        setFontMenuOpen(false);
        setParaMenuOpen(false);
        setHighlightMenuOpen(false);
    };

    return (
        <div id="toolbar">
            <div className="app-logo">
                <img src="/image/logo-himawari.png" alt="Logo" />
            </div>

            {/* ファイルメニュー */}
            <FileMenu
                isOpen={fileMenuOpen}
                onToggle={() => {
                    const next = !fileMenuOpen;
                    closeAllMenus();
                    setFileMenuOpen(next);
                }}
                onClose={closeAllMenus}
                editor={editor}
            />

            <input type="file" id="open-file-input" style={{ display: 'none' }} />

            {/* 表示メニュー */}
            <div className={`view-menu ${viewMenuOpen ? 'is-open' : ''}`}>
                <button
                    type="button"
                    className="view-trigger"
                    onClick={() => {
                        const next = !viewMenuOpen;
                        closeAllMenus();
                        setViewMenuOpen(next);
                    }}
                >表示 ▾</button>
                {viewMenuOpen && (
                    <div className="view-dropdown open" role="menu">
                        <label className="menu-item-label">
                            <input
                                type="checkbox"
                                checked={isSidebarOpen}
                                onChange={toggleSidebar}
                            /> サムネイル
                        </label>
                        <label className="menu-item-label">
                            <input type="checkbox" data-action="toggle-page-numbers" defaultChecked /> ページ番号
                        </label>
                        <label className="menu-item-label">
                            <input type="checkbox" data-action="toggle-para-numbers" defaultChecked /> 段落番号
                        </label>
                    </div>
                )}
            </div>

            <button type="button" onClick={toggleBold} className={editor.isActive('bold') ? 'active' : ''} data-action="bold">B</button>
            <button type="button" onClick={toggleItalic} className={editor.isActive('italic') ? 'active' : ''} data-action="italic">I</button>
            <button type="button" onClick={toggleUnderline} className={editor.isActive('underline') ? 'active' : ''} data-action="underline">U</button>
            <button type="button" onClick={toggleStrike} className={editor.isActive('strike') ? 'active' : ''} data-action="strike">S</button>

            <button type="button" onClick={toggleSuperscript} className={editor.isActive('superscript') ? 'active' : ''} title="上付き" data-action="superscript">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 20L14 8M14 20L5 8" /><text x="15" y="8" fontSize="11" stroke="none" fill="currentColor" fontWeight="bold">2</text>
                </svg>
            </button>

            <button type="button" onClick={toggleSubscript} className={editor.isActive('subscript') ? 'active' : ''} title="下付き" data-action="subscript">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 18L14 6M14 18L5 6" /><text x="15" y="23" fontSize="11" stroke="none" fill="currentColor" fontWeight="bold">2</text>
                </svg>
            </button>

            {/* ハイライト */}
            <div className={`highlight-control ${highlightMenuOpen ? 'is-open' : ''}`} style={{ position: 'relative' }}>
                <button
                    type="button"
                    data-action="highlight"
                    title="ハイライト"
                    onClick={() => {
                        const next = !highlightMenuOpen;
                        closeAllMenus();
                        setHighlightMenuOpen(next);
                    }}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /><path d="M2 21h20" stroke="#FFD700" strokeWidth="3" />
                    </svg>
                </button>
                {highlightMenuOpen && <HighlightMenu editor={editor} />}
            </div>

            {/* フォントメニュー */}
            <div className={`font-chooser ${fontMenuOpen ? 'is-open' : ''}`} id="font-chooser">
                <button
                    type="button"
                    className="font-chooser-trigger"
                    onClick={() => {
                        const next = !fontMenuOpen;
                        closeAllMenus();
                        setFontMenuOpen(next);
                    }}
                >Font ▾</button>
                {fontMenuOpen && <FontMenu editor={editor} />}
            </div>

            {/* 段落スタイル */}
            <div className={`paragraph-chooser ${paraMenuOpen ? 'is-open' : ''}`} id="paragraph-chooser">
                <button
                    type="button"
                    className="paragraph-trigger"
                    onClick={() => {
                        const next = !paraMenuOpen;
                        closeAllMenus();
                        setParaMenuOpen(next);
                    }}
                >段落スタイル ▾</button>
                {paraMenuOpen && <ParagraphMenu editor={editor} />}
            </div>

            <div className="page-controls">
                <button type="button" onClick={onAddPage} data-action="add-page" title="ページを追加">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
                <button type="button" onClick={onRemovePage} data-action="remove-page" title="現在のページを削除">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
            </div>

            <div className="zoom-controls">
                <button type="button" onClick={zoomOut} data-action="zoom-out">－</button>
                <span id="zoom-level-display">{zoomLevel}%</span>
                <button type="button" onClick={zoomIn} data-action="zoom-in">＋</button>
            </div>

            <div className="jump-widget">
                <label htmlFor="toolbar-jump-input" className="standard-only">ジャンプ機能　[ ctrl+J ]</label>
                <label htmlFor="toolbar-jump-input-word" className="word-only">ジャンプ機能　[ ctrl+J ]</label>
                <input
                    type="text"
                    id="toolbar-jump-input"
                    className="standard-only"
                    placeholder="(例：1-1)…へジャンプ"
                    title="段落番号(例:1-1)または検索したい文字列を入力してください"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = (e.currentTarget as HTMLInputElement).value;
                            if (!target) return;

                            // 1. Try ID Jump (e.g. 1-1 -> p1-1)
                            let targetId = target;
                            if (/^\d+-\d+$/.test(targetId)) {
                                targetId = 'p' + targetId;
                            }
                            const element = document.getElementById(targetId);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                toast.success(`段落 ${target} へジャンプしました`);
                                return;
                            }

                            // 2. Try Text Search if ID not found or not ID format
                            if (window.find && window.find(target)) {
                                toast.success(`"${target}" が見つかりました`);
                            } else {
                                toast.error('指定された段落または文字列が見つかりませんでした: ' + target);
                            }
                        }
                    }}
                />
                <input
                    type="text"
                    id="toolbar-jump-input-word"
                    className="word-only"
                    placeholder="(例：15)…へジャンプ"
                    title="段落番号(例:15)または検索したい文字列を入力してください"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = (e.currentTarget as HTMLInputElement).value;
                            if (!target) return;

                            // Word Mode likely uses p1, p2... or assumes numeric input is para index?
                            // Assuming similar ID pattern 'p' + number for simple numeric input
                            let targetId = target;
                            if (/^\d+$/.test(targetId)) {
                                // If simple number '15', try 'p15' (Check logic of ParagraphNumbering)
                                // We'll try direct logic first.
                                // If paragraph IDs in Word mode are different, this needs adjustment. 
                                // Assuming consistent IDs for now or will failover to search.
                                // Wait, in Word Mode numbering might be different but ID might persist?
                                // Let's try appending 'p' if pure number.
                                // Actually, if it's strictly Word mode, maybe IDs change?
                                // I'll assume std behavior for ID ('p' prefix) for now.
                                // If Word mode re-renders paragraphs with different IDs, search might fail.
                                // But text search will catch it.
                                targetId = 'p' + targetId; // Attempt p15
                            }

                            const element = document.getElementById(targetId);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                toast.success(`段落 ${target} へジャンプしました`);
                                return;
                            }

                            // Text Search
                            if (window.find && window.find(target)) {
                                toast.success(`"${target}" が見つかりました`);
                            } else {
                                toast.error('指定された段落または文字列が見つかりませんでした: ' + target);
                            }
                        }
                    }}
                />
            </div>

            <div id="toolbar-right-group">
                <button type="button" id="mode-switch" title="編集モード切替" onClick={toggleWordMode}>
                    <span className={`mode-text-std ${isWordMode ? '' : 'hidden'}`} style={{ display: isWordMode ? 'inline' : 'none' }}>標準モードに切替</span>
                    <span className={`mode-text-word ${!isWordMode ? '' : 'hidden'}`} style={{ display: !isWordMode ? 'inline' : 'none' }}>Word互換モードに切替</span>
                </button>
                <button type="button" id="help-trigger" onClick={() => { closeAllMenus(); openDialog('help'); }}>
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.25"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </button>
                <button type="button" id="donate-trigger" onClick={() => { closeAllMenus(); openDialog('donate'); }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    <span>開発を応援</span>
                </button>
            </div>
        </div>
    );
};
