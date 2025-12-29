import { useState, useCallback } from 'react';

export interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export interface PromptOptions {
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    inputType?: 'text' | 'url';
}

/**
 * ダイアログ管理フック
 * 
 * window.confirm()とwindow.prompt()の代替
 * 
 * 【使用方法】
 * ```typescript
 * const { confirm, prompt, ConfirmDialogComponent, PromptDialogComponent } = useDialogs();
 * 
 * const result = await confirm({ title: '確認', description: '削除しますか？' });
 * if (result) { ... }
 * 
 * const value = await prompt({ title: 'URL入力', placeholder: 'https://...' });
 * if (value) { ... }
 * ```
 */
export const useDialogs = () => {
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        options: ConfirmOptions | null;
        resolve: ((value: boolean) => void) | null;
    }>({
        open: false,
        options: null,
        resolve: null
    });

    const [promptState, setPromptState] = useState<{
        open: boolean;
        options: PromptOptions | null;
        resolve: ((value: string | null) => void) | null;
    }>({
        open: false,
        options: null,
        resolve: null
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                open: true,
                options,
                resolve
            });
        });
    }, []);

    const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setPromptState({
                open: true,
                options,
                resolve
            });
        });
    }, []);

    const handleConfirmClose = useCallback((confirmed: boolean) => {
        if (confirmState.resolve) {
            confirmState.resolve(confirmed);
        }
        setConfirmState({ open: false, options: null, resolve: null });
    }, [confirmState]);

    const handlePromptClose = useCallback((value: string | null) => {
        if (promptState.resolve) {
            promptState.resolve(value);
        }
        setPromptState({ open: false, options: null, resolve: null });
    }, [promptState]);

    return {
        confirm,
        prompt,
        confirmState,
        promptState,
        handleConfirmClose,
        handlePromptClose
    };
};
