import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger';
}

/**
 * 確認ダイアログ（Radix Alert Dialog版）
 * 
 * window.confirm()の代替
 * 
 * 【特徴】
 * - アクセシビリティ完全対応
 * - カスタマイズ可能なスタイル
 * - 非同期処理対応
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    confirmText = '確認',
    cancelText = 'キャンセル',
    onConfirm,
    variant = 'default'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const confirmButtonClass = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white';

    return (
        <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
                    <div className="space-y-2">
                        <AlertDialog.Title className="text-lg font-semibold">
                            {title}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-500">
                            {description}
                        </AlertDialog.Description>
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <AlertDialog.Cancel asChild>
                            <button className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                {cancelText}
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button 
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonClass}`}
                            >
                                {confirmText}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
