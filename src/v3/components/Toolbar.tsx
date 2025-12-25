import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold, Italic, Underline, Strikethrough,
    Superscript, Subscript, Highlighter,
    ChevronDown
} from 'lucide-react';

interface ToolbarProps {
    editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
    if (!editor) return null;

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
    const toggleStrike = () => editor.chain().focus().toggleStrike().run();

    return (
        <div id="toolbar">
            <div className="app-logo">
                <img src="/image/logo-himawari.png" alt="Logo" />
            </div>

            {/* ファイルメニュー（簡易化、後ほど詳細実装） */}
            <div className="file-menu">
                <button type="button" className="file-trigger">ファイル ▾</button>
            </div>

            <div className="view-menu">
                <button type="button" className="view-trigger">表示 ▾</button>
            </div>

            <div className="formatting-group">
                <button
                    type="button"
                    onClick={toggleBold}
                    className={editor.isActive('bold') ? 'active' : ''}
                    data-action="bold"
                >B</button>
                <button
                    type="button"
                    onClick={toggleItalic}
                    className={editor.isActive('italic') ? 'active' : ''}
                    data-action="italic"
                >I</button>
                <button
                    type="button"
                    onClick={toggleUnderline}
                    className={editor.isActive('underline') ? 'active' : ''}
                    data-action="underline"
                >U</button>
                <button
                    type="button"
                    onClick={toggleStrike}
                    className={editor.isActive('strike') ? 'active' : ''}
                    data-action="strike"
                >S</button>
            </div>

            {/* その他のツールバー要素（既存のCSSクラスを維持） */}
            {/* ... */}

            <div id="toolbar-right-group">
                <button type="button" id="mode-switch">
                    <span className="mode-text-std">標準モードに切替</span>
                </button>
                {/* ... */}
            </div>
        </div>
    );
};
