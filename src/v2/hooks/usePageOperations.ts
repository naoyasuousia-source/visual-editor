import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

interface UsePageOperationsOptions {
    confirm: (options: { title: string; description: string; variant?: 'default' | 'danger' }) => Promise<boolean>;
}

/**
 * ページ追加・削除のロジックを管理するカスタムフック
 * UIコンポーネントから完全に分離し、Tiptapのトランザクション操作のみを担当
 * 
 * 【重要】window.confirm()を使用せず、useDialogsフック経由で確認ダイアログを表示
 */
export const usePageOperations = (editor: Editor | null, options: UsePageOperationsOptions) => {
    const addPage = () => {
        if (!editor) return;
        
        const { tr } = editor.state;
        const node = editor.schema.nodes.page.createAndFill({
            class: 'page'
        });
        
        if (node) {
            const endPos = editor.state.doc.content.size;
            editor.view.dispatch(tr.insert(endPos, node));
            toast.success('ページを追加しました');
        }
    };

    const removePage = async () => {
        if (!editor) return;
        
        const { doc } = editor.state;
        const pages: any[] = [];
        
        doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                pages.push({ node, pos });
            }
        });
        
        if (pages.length === 0) return;
        
        // Radix Alert Dialogで確認
        const confirmed = await options.confirm({
            title: 'ページ削除の確認',
            description: '現在のページを削除してもよろしいですか？この操作は取り消せません。',
            variant: 'danger'
        });
        
        if (!confirmed) return;
        
        const { from } = editor.state.selection;
        let currentPageIndex = -1;
        
        for (let i = 0; i < pages.length; i++) {
            const pageStart = pages[i].pos;
            const pageEnd = pageStart + pages[i].node.nodeSize;
            if (from >= pageStart && from < pageEnd) {
                currentPageIndex = i;
                break;
            }
        }
        
        if (currentPageIndex === -1) currentPageIndex = pages.length - 1;

        if (pages.length === 1) {
            const { tr } = editor.state;
            const pageStart = pages[0].pos + 1;
            const pageEnd = pageStart + pages[0].node.content.size;
            tr.replaceWith(pageStart, pageEnd, editor.schema.nodes.paragraph.create());
            editor.view.dispatch(tr);
            toast.info('ページをクリアしました');
            return;
        }

        const { tr } = editor.state;
        const pageToRemove = pages[currentPageIndex];
        tr.delete(pageToRemove.pos, pageToRemove.pos + pageToRemove.node.nodeSize);
        editor.view.dispatch(tr);
        toast.success('ページを削除しました');
    };

    return {
        addPage,
        removePage
    };
};
