import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { buildFullHTML } from '@/utils/aiMetadata';
import { parseAndSetContent, importDocxToEditor } from '@/utils/io';
import contentCssText from '@/styles/content.css?raw';
import { useAppStore } from '@/store/useAppStore';
import * as fileService from '@/services/fileService';

/**
 * ファイル入出力を管理するカスタムフック
 * 
 * Tiptapエディタと外部ファイル（HTML/Docx）のやり取りを橋渡しします。
 */
export const useFileIO = (editor: Editor | null, isWordMode: boolean) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // グローバルストアからファイルハンドルを取得・更新
    const { currentFileHandle, setCurrentFileHandle, setInternalSaving, setLastModified } = useAppStore();

    /**
     * ファイルの最終更新時刻を取得してストアに同期
     * useFileSystemWatcherを使わず直接実装することで、正しいファイルハンドルを使用
     */
    const syncLastModifiedForHandle = useCallback(async (handle: FileSystemFileHandle) => {
        try {
            const file = await handle.getFile();
            setLastModified(file.lastModified);
            console.log('[FileIO] ファイル時刻を同期しました:', file.lastModified);
        } catch (err) {
            console.error('[FileIO] ファイル時刻の同期に失敗:', err);
        }
    }, [setLastModified]);

    /**
     * HTMLファイルを開く
     * @returns 成功した場合は true
     */
    const openFileWithHandle = async (): Promise<boolean> => {
        if (!editor) return false;

        try {
            setIsLoading(true);
            const result = await fileService.openHtmlFile();
            
            if (!result) return false; // キャンセル

            const { handle, content } = result;
            const { isWordModeDetected, pageMargin: detectedMargin } = parseAndSetContent(editor, content);
            
            // 検出された設定をストアに反映
            if (detectedMargin) {
                useAppStore.getState().setPageMargin(detectedMargin);
            }
            if (isWordModeDetected !== isWordMode) {
                useAppStore.getState().setWordMode(isWordModeDetected);
            }

            setCurrentFileHandle(handle);
            
            toast.success('ファイルを開きました');
            return true;
        } catch (err) {
            console.error('File open error:', err);
            toast.error(err instanceof Error ? err.message : 'ファイルを開けませんでした');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * エディタの状態から完全なHTML文字列を構築する内部用ヘルパー
     */
    const getFullHTML = (): string => {
        if (!editor) return '';
        
        const { pageMargin } = useAppStore.getState();
        const marginMap = { s: '12mm', m: '17mm', l: '24mm' };
        const pageMarginText = marginMap[pageMargin];
        
        // AI画像インデックスはDOMから直接取得（エクスポート用）
        const aiImageIndexHtml = document.getElementById('ai-image-index')?.outerHTML || '';
        
        return buildFullHTML(editor, isWordMode, contentCssText, pageMarginText, aiImageIndexHtml);
    };

    /**
     * 名前を付けて保存
     */
    const saveAsFile = async (): Promise<void> => {
        if (!editor) return;

        try {
            setIsLoading(true);
            setInternalSaving(true);
            const html = getFullHTML();
            const handle = await fileService.saveHtmlFileAs(html);

            if (handle) {
                setCurrentFileHandle(handle);
                // 自身の保存による変更検知を回避するために時刻を同期
                await syncLastModifiedForHandle(handle);
                toast.success('保存しました');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error(err instanceof Error ? err.message : '保存に失敗しました');
        } finally {
            setIsLoading(false);
            setInternalSaving(false);
        }
    };

    /**
     * 上書き保存
     */
    const saveFile = async (): Promise<void> => {
        if (!editor) return;

        if (!currentFileHandle) {
            await saveAsFile();
            return;
        }

        try {
            setIsLoading(true);
            setInternalSaving(true);
            const html = getFullHTML();
            await fileService.saveHtmlFile(currentFileHandle, html);
            // 自身の保存による変更検知を回避するために時刻を同期
            await syncLastModifiedForHandle(currentFileHandle);
            toast.success('上書き保存しました');
        } catch (err) {
            console.error('Overwrite error:', err);
            toast.error('保存に失敗しました');
        } finally {
            setIsLoading(false);
            setInternalSaving(false);
        }
    };

    /**
     * ファイルをダウンロード
     */
    const downloadFile = async (): Promise<void> => {
        if (!editor) return;

        try {
            setIsLoading(true);
            const html = getFullHTML();
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('ダウンロードしました');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('ダウンロードに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Wordファイルをインポート
     */
    const importDocx = async (file: File): Promise<void> => {
        if (!editor) return;

        try {
            setIsLoading(true);
            await importDocxToEditor(editor, file);
            toast.success('Wordファイルをインポートしました');
        } catch (err) {
            console.error('Docx import error:', err);
            toast.error('インポートに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        openFileWithHandle,
        saveFile,
        saveAsFile,
        downloadFile,
        importDocx,
        hasOpenFile: !!currentFileHandle
    };
};
