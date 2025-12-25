import React from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { generateFullHtml, parseAndSetContent, importDocxToEditor, readTextFromFile } from '../../utils/io';
import { useAppStore } from '../../store/useAppStore';

interface FileMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    editor: Editor | null;
}

export const FileMenu: React.FC<FileMenuProps> = ({ isOpen, onToggle, onClose, editor }) => {
    const { setPageMargin, isWordMode, toggleWordMode, openDialog } = useAppStore();

    const handleSave = () => {
        if (!editor) return;
        const html = generateFullHtml(editor, isWordMode);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("保存しました");
        onClose();
    };

    const handleOpenHtml = () => {
        const input = document.getElementById('open-file-input') as HTMLInputElement;
        if (input) {
            input.accept = '.html,.htm';
            input.onchange = async (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0 && editor) {
                    try {
                        const text = await readTextFromFile(target.files[0]);
                        const detectedWordMode = parseAndSetContent(editor, text, isWordMode);
                        if (detectedWordMode !== isWordMode) {
                            toggleWordMode();
                            toast.info(`モードを${detectedWordMode ? 'Word互換' : '標準'}モードに切り替えました`);
                        }
                    } catch (err: any) {
                        console.error(err);
                        toast.error(err.message || 'ファイルを開けませんでした。');
                    }
                }
                target.value = ''; // reset
            };
            input.click();
        }
        onClose();
    };

    const handleOpenDocx = () => {
        const input = document.getElementById('open-file-input') as HTMLInputElement;
        if (input) {
            input.accept = '.docx';
            input.onchange = async (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0 && editor) {
                    try {
                        await importDocxToEditor(editor, target.files[0]);
                    } catch (err: any) {
                        console.error(err);
                        toast.error(err.message || 'Wordファイルのインポートに失敗しました。');
                    }
                }
                target.value = ''; // reset
            };
            input.click();
        }
        onClose();
    };

    const handleAddLinkDest = () => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        if (from === to) {
            toast.warning('リンク先にする箇所を選択してください。');
            return;
        }
        const id = window.prompt('リンク先のIDを入力してください:');
        if (id) {
            editor.chain().focus().setAttributes('textStyle', { id }).run();
            toast.info('ID設定は現在開発中です (Tiptap extension required)');
        }
    };

    const handleRemoveLink = () => {
        if (editor) {
            editor.chain().focus().unsetLink().run();
        }
    };

    const handleInsertDropbox = () => {
        if (!editor) return;
        const inputUrl = window.prompt('Dropbox画像の共有URLを貼り付けてください。');
        if (!inputUrl) return;

        try {
            const parsed = new URL(inputUrl);
            const hostname = parsed.hostname.toLowerCase();
            if (!hostname.includes('dropbox.com')) {
                toast.error('Dropboxドメインではありません。dropbox.com のURLを選択してください。');
                return;
            }

            parsed.searchParams.delete('dl');
            parsed.searchParams.set('raw', '1');

            const normalizedUrl = parsed.toString();
            const alt = parsed.pathname.split('/').pop() || '';

            editor.chain().focus().setImage({ src: normalizedUrl, alt }).run();
            toast.success('Dropbox画像を挿入しました');
            onClose();
        } catch (err) {
            toast.error('正しいURL形式を入力してください。');
        }
    };

    const handleInsertWeb = () => {
        if (!editor) return;
        const inputUrl = window.prompt('画像URLを貼り付けてください。');
        if (!inputUrl) return;

        try {
            const parsed = new URL(inputUrl);
            const alt = parsed.pathname.split('/').pop() || '';

            editor.chain().focus().setImage({ src: parsed.toString(), alt }).run();
            toast.success('画像を挿入しました');
            onClose();
        } catch (err) {
            toast.error('正しいURL形式を入力してください。');
        }
    };

    return (
        <div className={`file-menu ${isOpen ? 'is-open' : ''}`}>
            <button
                type="button"
                className="file-trigger"
                onClick={onToggle}
            >ファイル ▾</button>
            {isOpen && (
                <div className="file-dropdown open" role="menu" aria-label="File options">
                    <button type="button" onClick={handleSave} data-action="save">保存<span className="shortcut-key">ctrl+S</span></button>
                    <button type="button" onClick={handleSave} data-action="save-as">名前を付けて保存</button>
                    <button type="button" onClick={handleSave} data-action="overwrite">上書き保存<span className="shortcut-key">ctrl+S</span></button>
                    <button type="button" onClick={handleOpenHtml} data-action="open-html">HTMLファイルを開く<span className="shortcut-key">ctrl+O</span></button>
                    <button type="button" onClick={handleOpenDocx} data-action="open-docx" className="word-only">Wordファイル(docx)を開く</button>
                    <button type="button" data-action="print" onClick={() => { window.print(); onClose(); }}>PDFとして出力</button>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">ハイパーリンク</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" onClick={handleAddLinkDest} data-action="add-link-destination">リンク先に追加</button>
                            <button type="button" onClick={() => openDialog('link')} data-action="create-link">リンクを生成</button>
                            <button type="button" onClick={handleRemoveLink} data-action="remove-link">リンクを削除</button>
                        </div>
                    </div>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">画像を挿入</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" onClick={handleInsertDropbox} data-action="insert-image-dropbox">dropboxから挿入</button>
                            <button type="button" onClick={handleInsertWeb} data-action="insert-image-web">web上の画像を挿入</button>
                        </div>
                    </div>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">余白</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" onClick={() => setPageMargin('s')} data-action="page-margin" data-size="s">S</button>
                            <button type="button" onClick={() => setPageMargin('m')} data-action="page-margin" data-size="m">M</button>
                            <button type="button" onClick={() => setPageMargin('l')} data-action="page-margin" data-size="l">L</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
