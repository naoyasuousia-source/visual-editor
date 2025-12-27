import React from 'react';
import { Editor } from '@tiptap/react';
import { HelpDialog } from '@/components/common/dialogs/HelpDialog';
import { SubHelpDialog } from '@/components/common/dialogs/SubHelpDialog';
import { BrowserWarningDialog } from '@/components/common/dialogs/BrowserWarningDialog';
import { DonateDialog } from '@/components/common/dialogs/DonateDialog';
import { LinkDialog } from '@/components/common/dialogs/LinkDialog';
import { ImageTitleDialog } from '@/components/common/dialogs/ImageTitleDialog';
import { ImageCaptionDialog } from '@/components/common/dialogs/ImageCaptionDialog';
import { ImageTagDialog } from '@/components/common/dialogs/ImageTagDialog';
import { ParagraphJumpDialog } from '@/components/common/dialogs/ParagraphJumpDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';

/**
 * DialogGroup - 全ダイアログを統合管理するコンポーネント
 * 
 * エディタで使用する全てのダイアログを一箇所で管理します。
 * App.tsx からダイアログ定義を分離し、components/common に配置することで、
 * コンポーネントの責務を明確化します。
 */
interface DialogGroupProps {
    editor: Editor | null;
    activeDialog: string | null;
    closeDialog: () => void;
    showBrowserWarning: boolean;
    setShowBrowserWarning: (show: boolean) => void;
    confirmState: {
        open: boolean;
        options: {
            title: string;
            description?: string;
            confirmText?: string;
            cancelText?: string;
            variant?: 'default' | 'destructive';
        } | null;
    };
    promptState: {
        open: boolean;
        options: {
            title: string;
            description?: string;
            placeholder?: string;
            defaultValue?: string;
            confirmText?: string;
            cancelText?: string;
            inputType?: 'text' | 'url';
        } | null;
    };
    handleConfirmClose: (confirmed: boolean) => void;
    handlePromptClose: (value: string | null) => void;
}

export const DialogGroup: React.FC<DialogGroupProps> = ({
    editor,
    activeDialog,
    closeDialog,
    showBrowserWarning,
    setShowBrowserWarning,
    confirmState,
    promptState,
    handleConfirmClose,
    handlePromptClose,
}) => {
    return (
        <>
            {/* System Dialogs */}
            <HelpDialog open={activeDialog === 'help'} onClose={closeDialog} />
            <SubHelpDialog />
            <BrowserWarningDialog isOpen={showBrowserWarning} onClose={() => setShowBrowserWarning(false)} />
            <DonateDialog open={activeDialog === 'donate'} onClose={closeDialog} />

            {/* Editor-specific Dialogs */}
            {editor && (
                <>
                    <LinkDialog open={activeDialog === 'link'} editor={editor} onClose={closeDialog} />
                    <ImageTitleDialog open={activeDialog === 'image-title'} editor={editor} onClose={closeDialog} />
                    <ImageCaptionDialog open={activeDialog === 'image-caption'} editor={editor} onClose={closeDialog} />
                    <ImageTagDialog open={activeDialog === 'image-tag'} editor={editor} onClose={closeDialog} />
                    <ParagraphJumpDialog open={activeDialog === 'paragraph-jump'} editor={editor} onClose={closeDialog} />
                </>
            )}

            {/* Confirm & Prompt Dialogs */}
            {confirmState.options && (
                <ConfirmDialog
                    open={confirmState.open}
                    onOpenChange={(open) => !open && handleConfirmClose(false)}
                    title={confirmState.options.title}
                    description={confirmState.options.description}
                    confirmText={confirmState.options.confirmText}
                    cancelText={confirmState.options.cancelText}
                    variant={confirmState.options.variant}
                    onConfirm={() => handleConfirmClose(true)}
                />
            )}
            {promptState.options && (
                <PromptDialog
                    open={promptState.open}
                    onOpenChange={(open) => !open && handlePromptClose(null)}
                    title={promptState.options.title}
                    description={promptState.options.description}
                    placeholder={promptState.options.placeholder}
                    defaultValue={promptState.options.defaultValue}
                    confirmText={promptState.options.confirmText}
                    cancelText={promptState.options.cancelText}
                    inputType={promptState.options.inputType}
                    onConfirm={(value) => handlePromptClose(value)}
                />
            )}
        </>
    );
};
