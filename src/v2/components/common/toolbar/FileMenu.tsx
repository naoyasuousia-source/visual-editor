import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu, MenuSeparator } from '@/components/ui/BaseDropdownMenu';
import { useAppStore } from '@/store/useAppStore';
import { useFileIO } from '@/hooks/useFileIO';
import { useImageInsert } from '@/hooks/useImageInsert';
import { useLinkActions } from '@/hooks/useLinkActions';

interface FileMenuProps {
    editor: Editor | null;
    prompt: (options: { 
        title: string; 
        description?: string; 
        placeholder?: string; 
        inputType?: 'text' | 'url' 
    }) => Promise<string | null>;
}

/**
 * ファイルメニュー（Radix UI版）
 * 
 * 【改善点】
 * - Radix Dropdown Menuで完全置き換え
 * - useFileIOフックでロジック分離
 * - useImageInsertフックで画像挿入ロジック分離
 * - 直接DOM操作を完全排除
 */
export const FileMenu: React.FC<FileMenuProps> = ({ editor, prompt }) => {
    const { setPageMargin, isWordMode, openDialog } = useAppStore();
    const { saveFile, saveAsFile, downloadFile, openFileWithHandle, importDocx } = useFileIO(editor, isWordMode);
    const { insertFromDropbox, insertFromWeb } = useImageInsert(editor, { prompt });
    const { addLinkDestination, createLink, removeLink } = useLinkActions(editor, { prompt });
    
    const htmlInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);

    const handleOpenHtml = async () => {
        // Try File System Access API first
        const success = await openFileWithHandle();
        
        // Fallback to input element if not supported
        if (!success) {
            htmlInputRef.current?.click();
        }
    };

    const handleOpenHtmlFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            const { readTextFromFile, parseAndSetContent } = await import('@/utils/io');
            const { toggleWordMode } = useAppStore.getState();
            try {
                const text = await readTextFromFile(e.target.files[0]);
                const detectedWordMode = parseAndSetContent(editor, text, isWordMode);
                if (detectedWordMode !== isWordMode) {
                    toggleWordMode();
                }
            } catch (err) {
                console.error(err);
            }
        }
        e.target.value = '';
    };

    const handleOpenDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && editor) {
            try {
                await importDocx(e.target.files[0]);
            } catch (err) {
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
                onChange={handleOpenHtmlFallback} 
            />
            <input 
                ref={docxInputRef}
                type="file" 
                className="hidden" 
                accept=".docx" 
                onChange={handleOpenDocx} 
            />

            <BaseDropdownMenu
                id="file"
                trigger={
                    <button
                        type="button"
                        className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[36px]"
                    >
                        ファイル <ChevronDown className="w-3 h-3" />
                    </button>
                }
            >
                <MenuItem onSelect={downloadFile} shortcut="Ctrl+S">
                    保存
                </MenuItem>
                <MenuItem onSelect={saveAsFile} shortcut="Ctrl+N">
                    名前を付けて保存
                </MenuItem>
                <MenuItem onSelect={saveFile} shortcut="Ctrl+S">
                    上書き保存
                </MenuItem>

                <MenuItem onSelect={handleOpenHtml} shortcut="Ctrl+O">
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
                            <MenuItem onSelect={() => addLinkDestination(editor)}>
                                リンク先に追加
                            </MenuItem>
                            <MenuItem onSelect={() => createLink(editor)}>
                                リンクを生成
                            </MenuItem>
                            <MenuItem onSelect={() => removeLink(editor)}>
                                リンクを削除
                            </MenuItem>
                        </SubMenu>

                        <SubMenu trigger="画像を挿入">
                            <MenuItem onSelect={insertFromDropbox}>
                                Dropboxから挿入
                            </MenuItem>
                            <MenuItem onSelect={insertFromWeb}>
                                Web上の画像を挿入
                            </MenuItem>
                        </SubMenu>

                        <SubMenu trigger="余白">
                            <MenuItem onSelect={(e) => { e.preventDefault(); setPageMargin('s'); }}>
                                狭い
                            </MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); setPageMargin('m'); }}>
                                標準
                            </MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); setPageMargin('l'); }}>
                                広い
                            </MenuItem>
                        </SubMenu>
                    </>
                )}
            </BaseDropdownMenu>
        </>
    );
};
