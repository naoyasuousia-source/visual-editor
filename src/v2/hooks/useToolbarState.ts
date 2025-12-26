import { useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { useFormattingActions } from '@/hooks/useFormattingActions';

/**
 * Toolbar State Management Hook
 * 
 * Based on v1's toolbar.ts updateToolbarState function.
 * Manages dynamic toolbar button states based on current editor context.
 */

const BLOCK_LABEL_MAP: Record<string, string> = {
    'h1': '見出し１',
    'h2': '見出し２',
    'h3': '見出し３',
    'p': '本文',
    'h6': 'サブテキスト'
};

export const useToolbarState = (editor: Editor | null) => {
    const formattingActions = useFormattingActions(editor);

    /**
     * Update toolbar state based on current selection
     * Called on selection change
     */
    const updateToolbarState = () => {
        if (!editor) return;

        // Get current paragraph type
        const attrs = editor.getAttributes('paragraph');
        const headingAttrs = editor.getAttributes('heading');
        
        let blockType = 'p';
        if (headingAttrs.level) {
            blockType = `h${headingAttrs.level}`;
        }

        // Get block label
        const blockLabel = BLOCK_LABEL_MAP[blockType] || '本文';

        // Update hanging indent checkbox state
        const canHanging = formattingActions.canHangingIndent();
        const hasHanging = formattingActions.hasHangingIndent();

        return {
            blockType,
            blockLabel,
            canHangingIndent: canHanging,
            hasHangingIndent: hasHanging,
        };
    };

    // Auto-update on selection change
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            updateToolbarState();
        };

        editor.on('selectionUpdate', handleUpdate);
        editor.on('transaction', handleUpdate);

        return () => {
            editor.off('selectionUpdate', handleUpdate);
            editor.off('transaction', handleUpdate);
        };
    }, [editor]);

    return {
        updateToolbarState,
    };
};
