import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FileMenu } from './menus/FileMenu';
import { ParagraphMenu } from './menus/ParagraphMenu';
import { FontMenu } from './menus/FontMenu';

interface ToolbarProps {
    editor: Editor | null;
    onShowHelp: () => void;
    onShowDonate: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor, onShowHelp, onShowDonate }) => {
    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const [viewMenuOpen, setViewMenuOpen] = useState(false);
    const [fontMenuOpen, setFontMenuOpen] = useState(false);
    const [paraMenuOpen, setParaMenuOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

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
    };

    return (
        <div id="toolbar">
            <div className="app-logo">
                <img src="/image/logo-himawari.png" alt="Logo" />
            </div>

            {/* ファイルメニュー */}
            {/* ファイルメニュー */}
            <FileMenu
                isOpen={fileMenuOpen}
                onToggle={() => {
                    const next = !fileMenuOpen;
                    closeAllMenus();
                    setFileMenuOpen(next);
                }}
                onClose={closeAllMenus}
            />

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
            <div className="highlight-control">
                <button type="button" data-action="highlight" title="ハイライト">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /><path d="M2 21h20" stroke="#FFD700" strokeWidth="3" />
                    </svg>
                </button>
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
                <button type="button" data-action="add-page" title="ページを追加">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
                <button type="button" data-action="remove-page" title="現在のページを削除">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
            </div>

            <div className="zoom-controls">
                <button type="button" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} data-action="zoom-out">－</button>
                <span id="zoom-level-display">{zoomLevel}%</span>
                <button type="button" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} data-action="zoom-in">＋</button>
            </div>

            <div className="jump-widget">
                <input
                    type="text"
                    className="standard-only"
                    placeholder="(例：1-1)…へジャンプ"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = (e.currentTarget as HTMLInputElement).value;
                            if (!target) return;
                            let targetId = target;
                            if (/^\d+-\d+$/.test(targetId)) {
                                targetId = 'p' + targetId;
                            }
                            const element = document.getElementById(targetId);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            } else {
                                alert('指定された段落が見つかりませんでした: ' + targetId);
                            }
                        }
                    }}
                />
            </div>

            <div id="toolbar-right-group">
                <button type="button" id="mode-switch" title="編集モード切替">
                    <span className="mode-text-std">標準モードに切替</span>
                    <span className="mode-text-word">Word互換モードに切替</span>
                </button>
                <button type="button" id="help-trigger" onClick={() => { closeAllMenus(); onShowHelp(); }}>
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.25"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </button>
                <button type="button" id="donate-trigger" onClick={() => { closeAllMenus(); onShowDonate(); }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    <span>開発を応援</span>
                </button>
            </div>
        </div>
    );
};
