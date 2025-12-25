import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu, MenuSeparator } from '../ui/BaseDropdownMenu';
import { useAppStore } from '../../store/useAppStore';
import { useFileIO } from '../../hooks/useFileIO';

interface FileMenuProps {
    editor: Editor | null;
}

/**
 * ファイルメニュー（Radix UI版）
 * 
 * 【改善点】
 * - Radix Dropdown Menuで完全置き換え
 * - useFileIOフックでロジック分離
 * - 直接DOM操作を完全排除
 */
export const FileMenu: React.FC<FileMenuProps> = ({ editor }) => {
    const { setPageMargin, isWordMode, openDialog } = useAppStore();
    const { saveFile, saveAsFile, downloadFile } = useFileIO(editor, isWordMode);
    
    const htmlInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);

    const handleOpenHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            const { readTextFromFile, parseAndSetContent } = await import('../../utils/io');
            const { toggleWordMode } = useAppStore.getState();
            try {
                const text = await readTextFromFile(e.target.files[0]);
                const detectedWordMode = parseAndSetContent(editor, text, isWordMode);
                if (detectedWordMode !== isWordMode) {
                    toggleWordMode();
                }
            } catch (err: any) {
                console.error(err);
            }
        }
        e.target.value = '';
    };

    const handleOpenDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            const { importDocx } = useFileIO(editor, isWordMode);
            try {
                await importDocx(e.target.files[0]);
            } catch (err: any) {
                console.error(err);
            }
        }
        e.target.value = '';
    };

    return (
        <>
            <input 
                ref={htmlInputRef}
                type="file" 
                className="hidden" 
                accept=".html,.htm" 
                onChange={handleOpenHtml} 
            />
            <input 
                ref={docxInputRef}
                type="file" 
                className="hidden" 
                accept=".docx" 
                onChange={handleOpenDocx} 
            />

            <BaseDropdownMenu
                trigger={
                    <button
                        type="button"
                        className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]"
                    >
                        ファイル <ChevronDown className="w-3 h-3" />
                    </button>
                }
            >
                <MenuItem onSelect={downloadFile} shortcut="Ctrl+S">
                    保存
                </MenuItem>
                <MenuItem onSelect={saveAsFile}>
                    名前を付けて保存
                </MenuItem>
                <MenuItem onSelect={saveFile} shortcut="Ctrl+S">
                    上書き保存
                </MenuItem>

                <MenuItem onSelect={() => htmlInputRef.current?.click()} shortcut="Ctrl+O">
                    HTMLファイルを開く
                </MenuItem>

                {isWordMode && (
                    <MenuItem onSelect={() => docxInputRef.current?.click()}>
                        Wordファイル(docx)を開く
                    </MenuItem>
                )}

                {!isWordMode && (
                    <>
                        <MenuItem onSelect={() => window.print()}>
                            PDFとして出力
                        </MenuItem>

                        <MenuSeparator />

                        <SubMenu trigger="ハイパーリンク">
                            <MenuItem onSelect={() => openDialog('link')}>
                                リンクを生成
                            </MenuItem>
                            <MenuItem onSelect={() => editor?.chain().focus().unsetLink().run()}>
                                リンクを削除
                            </MenuItem>
                        </SubMenu>

                        <SubMenu trigger="画像を挿入">
                            <MenuItem onSelect={() => {
                                const url = window.prompt('Dropbox共有URLを入力');
                                if (url && editor) {
                                    // Dropbox URL変換ロジックは後でフックに移動
                                    const parsed = new URL(url);
                                    parsed.searchParams.delete('dl');
                                    parsed.searchParams.set('raw', '1');
                                    editor.chain().focus().setImage({ src: parsed.toString() }).run();
                                }
                            }}>
                                Dropboxから挿入
                            </MenuItem>
                            <MenuItem onSelect={() => {
                                const url = window.prompt('画像URLを入力');
                                if (url && editor) editor.chain().focus().setImage({ src: url }).run();
                            }}>
                                Web上の画像を挿入
                            </MenuItem>
                        </SubMenu>

                        <SubMenu trigger="余白">
                            <MenuItem onSelect={() => setPageMargin('s')}>
                                サイズ S
                            </MenuItem>
                            <MenuItem onSelect={() => setPageMargin('m')}>
                                サイズ M
                            </MenuItem>
                            <MenuItem onSelect={() => setPageMargin('l')}>
                                サイズ L
                            </MenuItem>
                        </SubMenu>
                    </>
                )}
            </BaseDropdownMenu>
        </>
    );
};
