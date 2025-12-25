import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface BaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Radix UIベースの共通ダイアログコンポーネント
 * 
 * 【特徴】
 * - アクセシビリティ完全対応（WAI-ARIA準拠）
 * - フォーカストラップ、ESCキー対応が標準装備
 * - Tailwind CSSで完全にスタイル制御
 */
export const BaseDialog: React.FC<BaseDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    maxWidth = 'md'
}) => {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* Overlay */}
                <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                
                {/* Content */}
                <Dialog.Content 
                    className={`fixed left-[50%] top-[50%] z-50 w-full ${maxWidthClasses[maxWidth]} translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg`}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                                {title}
                            </Dialog.Title>
                            {description && (
                                <Dialog.Description className="text-sm text-gray-500">
                                    {description}
                                </Dialog.Description>
                            )}
                        </div>
                        
                        {/* Close Button */}
                        <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100">
                            <X className="h-4 w-4" />
                            <span className="sr-only">閉じる</span>
                        </Dialog.Close>
                    </div>

                    {/* Body */}
                    <div className="mt-4">
                        {children}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
