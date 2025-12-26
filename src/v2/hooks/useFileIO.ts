import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { buildFullHTML } from '@/utils/aiMetadata';
import { parseAndSetContent, importDocxToEditor } from '@/utils/io';
import contentCssText from '@/styles/content.css?raw';

/**
 * ファイル入出力を管理するカスタムフック
 * V1のio.ts機能をReactフック化
 * 
 * 【重要】すべてのファイル操作はこのフックを経由する
 */
export const useFileIO = (editor: Editor | null, isWordMode: boolean) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentFileHandle, setCurrentFileHandle] = useState<any>(null);

    /**
     * HTMLファイルを開く（File System Access API使用）
     */
    const openFile = async (): Promise<boolean> => {
        if (!editor) return false;
        
        if (typeof (window as any).showOpenFilePicker !== 'function') {
            // フォールバック: input要素を使用
            return false;
        }

        try {
            setIsLoading(true);
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'HTML Files',
                    accept: { 'text/html': ['.html', '.htm'] }
                }],
                multiple: false
            });

            const file = await handle.getFile();
            const text = await file.text();
            
            const detectedWordMode = parseAndSetContent(editor, text, isWordMode);
            setCurrentFileHandle(handle);
            
            toast.success('ファイルを開きました');
            return true;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('File open error:', err);
                toast.error('ファイルを開けませんでした');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * HTMLファイルを保存（名前を付けて保存）
     */
    const saveAsFile = async (): Promise<void> => {
        if (!editor) return;

        if (typeof (window as any).showSaveFilePicker !== 'function') {
            // フォールバック: ダウンロード
            await downloadFile();
            return;
        }

        try {
            setIsLoading(true);
            const handle = await (window as any).showSaveFilePicker({
                types: [{
                    description: 'HTML Files',
                    accept: { 'text/html': ['.html', '.htm'] }
                }],
                suggestedName: 'document.html'
            });

            const writable = await handle.createWritable();
            const html = buildFullHTML(editor, isWordMode, contentCssText);
            await writable.write(html);
            await writable.close();

            setCurrentFileHandle(handle);
            toast.success('保存しました');
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Save error:', err);
                toast.error('保存に失敗しました');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 現在のファイルに上書き保存
     */
    const saveFile = async (): Promise<void> => {
        if (!editor) return;

        if (!currentFileHandle) {
            await saveAsFile();
            return;
        }

        try {
            setIsLoading(true);
            const writable = await currentFileHandle.createWritable();
            const html = buildFullHTML(editor, isWordMode, contentCssText);
            await writable.write(html);
            await writable.close();

            toast.success('上書き保存しました');
        } catch (err) {
            console.error('Overwrite error:', err);
            toast.error('保存に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ファイルをダウンロード（フォールバック）
     */
    const downloadFile = async (): Promise<void> => {
        if (!editor) return;

        try {
            setIsLoading(true);
            const html = buildFullHTML(editor, isWordMode, contentCssText);
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
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Docxファイルをインポート
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
        openFile,
        saveFile,
        saveAsFile,
        downloadFile,
        importDocx,
        hasOpenFile: !!currentFileHandle
    };
};
