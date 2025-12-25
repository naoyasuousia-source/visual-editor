import React, { useState, useEffect } from 'react';
import { BaseDialog } from './BaseDialog';

interface PromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    inputType?: 'text' | 'url';
}

/**
 * プロンプトダイアログ
 * 
 * window.prompt()の代替
 * 
 * 【特徴】
 * - アクセシビリティ完全対応
 * - バリデーション対応
 * - カスタマイズ可能
 */
export const PromptDialog: React.FC<PromptDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    placeholder = '',
    defaultValue = '',
    confirmText = '確認',
    cancelText = 'キャンセル',
    onConfirm,
    inputType = 'text'
}) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
        }
    }, [open, defaultValue]);

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim());
            onOpenChange(false);
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="space-y-4">
                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder={placeholder}
                    autoFocus
                />

                <div className="flex gap-2 justify-end">
                    <button 
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="submit"
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </form>
        </BaseDialog>
    );
};
