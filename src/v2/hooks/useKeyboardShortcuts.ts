import { useEffect } from 'react';

/**
 * Keyboard Shortcuts Hook
 * 
 * ファイル操作のキーボードショートカット (Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+J) を管理します。
 * App.tsx からロジックを分離し、hooks/ に配置することで、
 * rules.md の「ロジックとUIの分離」原則に準拠します。
 * 
 * @param saveFile - ファイル保存関数（既存のファイルハンドルに上書き保存）
 * @param saveAsFile - 名前を付けて保存関数
 * @param downloadFile - ファイルダウンロード関数（ファイルハンドルがない場合）
 * @param openFileWithHandle - ファイルを開く関数
 * @param currentFileHandle - 現在のファイルハンドル（nullの場合はダウンロード）
 * @param triggerJumpInputFocus - ジャンプ入力ボックスへのフォーカストリガー関数
 */
export const useKeyboardShortcuts = (
    saveFile: () => void,
    saveAsFile: () => void,
    downloadFile: () => void,
    openFileWithHandle: () => void,
    currentFileHandle: FileSystemFileHandle | null,
    triggerJumpInputFocus: () => void
) => {
    useEffect(() => {
        /**
         * キーボードイベントハンドラ
         * - Ctrl+S: ファイル保存（ハンドルがあれば上書き、なければダウンロード）
         * - Ctrl+N: 名前を付けて保存
         * - Ctrl+O: ファイルを開く
         * - Ctrl+J: ジャンプ入力ボックスにフォーカス
         */
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S: シンプル保存（ファイルハンドルがあれば上書き、なければダウンロード）
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (currentFileHandle) {
                    saveFile();
                } else {
                    downloadFile();
                }
            }
            
            // Ctrl+N: 名前を付けて保存
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                saveAsFile();
            }
            
            // Ctrl+O: ファイルを開く
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                openFileWithHandle();
            }

            // Ctrl+J: ジャンプ入力ボックスにフォーカス（v1準拠）
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
                e.preventDefault();
                triggerJumpInputFocus();
            }
        };

        // イベントリスナーの登録
        window.addEventListener('keydown', handleKeyDown);
        
        // クリーンアップ: メモリリーク防止のため、必ずイベントリスナーを解除
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveFile, saveAsFile, downloadFile, openFileWithHandle, currentFileHandle, triggerJumpInputFocus]);
};
