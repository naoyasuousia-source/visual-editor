import React from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { ChevronRight, ChevronDown } from 'lucide-react';
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

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

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
    };

    const handleOpenHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            try {
                const text = await readTextFromFile(e.target.files[0]);
                const detectedWordMode = parseAndSetContent(editor, text, isWordMode);
                if (detectedWordMode !== isWordMode) {
                    toggleWordMode();
                    toast.info(`モードを${detectedWordMode ? 'Word互換' : '標準'}モードに切り替えました`);
                }
            } catch (err: any) {
                toast.error(err.message || 'ファイルを開けませんでした。');
            }
        }
        e.target.value = '';
    };

    const handleOpenDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            try {
                await importDocxToEditor(editor, e.target.files[0]);
            } catch (err: any) {
                toast.error(err.message || 'Wordファイルのインポートに失敗しました。');
            }
        }
        e.target.value = '';
    };

    const menuBtn = "w-full text-left px-4 py-1.5 hover:bg-gray-100 flex justify-between items-center text-sm transition-colors group relative";
    const shortcut = "text-[10px] text-gray-400 font-mono ml-4";
    const nestedMenu = "absolute left-full top-0 ml-0.5 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[180px] hidden group-hover:block transition-all";

    return (
        <div className="relative">
            <button
                type="button"
                className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]"
                onClick={onToggle}
            >
                ファイル <ChevronDown className="w-3 h-3" />
            </button>
            
            <input type="file" id="menu-open-html" className="hidden" accept=".html,.htm" onChange={handleOpenHtml} />
            <input type="file" id="menu-open-docx" className="hidden" accept=".docx" onChange={handleOpenDocx} />

            {isOpen && (
                <div 
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[220px] z-[2001] animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => {}} // Optional: might want to close on leave if not clicked?
                >
                    <button type="button" className={menuBtn} onClick={() => handleAction(handleSave)}>
                        保存 <span className={shortcut}>Ctrl+S</span>
                    </button>
                    <button type="button" className={menuBtn} onClick={() => handleAction(handleSave)}>
                        名前を付けて保存
                    </button>
                    <button type="button" className={menuBtn} onClick={() => handleAction(handleSave)}>
                        上書き保存 <span className={shortcut}>Ctrl+S</span>
                    </button>
                    
                    <button type="button" className={menuBtn} onClick={() => handleAction(() => document.getElementById('menu-open-html')?.click())}>
                        HTMLファイルを開く <span className={shortcut}>Ctrl+O</span>
                    </button>
                    
                    {isWordMode && (
                        <button type="button" className={menuBtn} onClick={() => handleAction(() => document.getElementById('menu-open-docx')?.click())}>
                            Wordファイル(docx)を開く
                        </button>
                    )}
                    
                    {!isWordMode && (
                        <>
                            <button type="button" className={menuBtn} onClick={() => handleAction(() => window.print())}>
                                PDFとして出力
                            </button>
                            
                            <hr className="my-1 border-gray-200" />
                            
                            {/* Nested: Hyperlinks */}
                            <div className={menuBtn}>
                                <span>ハイパーリンク</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <div className={nestedMenu}>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => openDialog('link'))}>リンクを生成</button>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => editor?.chain().focus().unsetLink().run())}>リンクを削除</button>
                                </div>
                            </div>

                            {/* Nested: Images */}
                            <div className={menuBtn}>
                                <span>画像を挿入</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <div className={nestedMenu}>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => {
                                        const url = window.prompt('Dropbox共有URLを入力');
                                        if (url && editor) editor.chain().focus().setImage({ src: url }).run();
                                    })}>Dropboxから挿入</button>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => {
                                        const url = window.prompt('画像URLを入力');
                                        if (url && editor) editor.chain().focus().setImage({ src: url }).run();
                                    })}>Web上の画像を挿入</button>
                                </div>
                            </div>

                            {/* Nested: Margins */}
                            <div className={menuBtn}>
                                <span>余白</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <div className={nestedMenu}>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => setPageMargin('s'))}>サイズ S</button>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => setPageMargin('m'))}>サイズ M</button>
                                    <button type="button" className={menuBtn} onClick={() => handleAction(() => setPageMargin('l'))}>サイズ L</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
