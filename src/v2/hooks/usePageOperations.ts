import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

/**
 * ページ追加・削除のロジックを管理するカスタムフック
 * UIコンポーネントから完全に分離し、Tiptapのトランザクション操作のみを担当
 */
export const usePageOperations = (editor: Editor | null) => {
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

    const removePage = () => {
        if (!editor) return;
        
        const { doc } = editor.state;
        const pages: any[] = [];
        
        doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                pages.push({ node, pos });
            }
        });
        
        if (pages.length === 0) return;
        if (!window.confirm('現在のページを削除してもよろしいですか？')) return;
        
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
