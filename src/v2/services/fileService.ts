/**
 * File Service
 * 
 * File System Access API を使用した外部ファイル操作を管理します。
 * rules.md の「4層アーキテクチャ (services)」に従い、React ステートを持たない非同期処理をカプセル化します。
 */

/**
 * ファイルハンドルと内容のラップ用型定義
 */
export interface FileHandleWrapper {
    handle: FileSystemFileHandle;
    content: string;
}

/**
 * HTMLファイルを開くダイアログを表示し、ファイル名と内容を返します。
 * @returns ファイルハンドルと内容、キャンセルされた場合は null
 */
export async function openHtmlFile(): Promise<FileHandleWrapper | null> {
    if (!window.showOpenFilePicker) {
        throw new Error('お使いのブラウザは File System Access API に対応していません。');
    }

    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }],
            multiple: false
        });

        const file = await handle.getFile();
        const content = await file.text();
        
        return { handle, content };
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            return null; // ユーザーによるキャンセル
        }
        throw err;
    }
}

/**
 * 指定されたHTML文字列を新規ファイルとして保存します（名前を付けて保存）。
 * @param html 保存するHTML文字列
 * @param suggestedName デフォルトのファイル名
 * @returns 新しいファイルハンドル、キャンセルされた場合は null
 */
export async function saveHtmlFileAs(html: string, suggestedName: string = 'document.html'): Promise<FileSystemFileHandle | null> {
    if (!window.showSaveFilePicker) {
        throw new Error('お使いのブラウザは File System Access API に対応していません。');
    }

    try {
        const handle = await window.showSaveFilePicker({
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }],
            suggestedName
        });

        const writable = await handle.createWritable();
        await writable.write(html);
        await writable.close();

        return handle;
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            return null;
        }
        throw err;
    }
}

/**
 * 既存のファイルハンドルに対して上書き保存を行います。
 * @param handle ファイルハンドル
 * @param html 保存するHTML文字列
 */
export async function saveHtmlFile(handle: FileSystemFileHandle, html: string): Promise<void> {
    const writable = await handle.createWritable();
    await writable.write(html);
    await writable.close();
}
