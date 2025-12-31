import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { HELP_CONTENT } from '@/constants/help-info';
import { BaseDialog } from '@/components/ui/BaseDialog';

/**
 * 詳細情報（利用規約、プライバシーポリシー等）を表示するサブダイアログ
 * BaseDialogを継承することで、スクロール、フォーカス、閉じやすさの問題を解消
 */
export const SubHelpDialog: React.FC = () => {
    const { subHelpData, closeSubHelp } = useAppStore();

    const content = subHelpData.type ? HELP_CONTENT[subHelpData.type] : '';
    
    return (
        <BaseDialog
            open={subHelpData.isOpen}
            onOpenChange={closeSubHelp}
            title={subHelpData.type || '詳細情報'}
            maxWidth="xl"
        >
            <div 
                className={`
                    px-2 py-4 max-h-[70vh] overflow-y-auto text-[14px] text-slate-600 leading-relaxed font-medium font-['Noto_Sans_JP',sans-serif]
                    scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent
                    /* 既存のHTMLコンテンツへのスタイリング */
                    [&_.section-title]:text-slate-800 [&_.section-title]:font-bold [&_.section-title]:text-[15px] [&_.section-title]:mt-8 [&_.section-title]:mb-3 [&_.section-title]:block
                    [&_p]:mb-4
                    [&_a]:text-cyan-600 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-cyan-200 [&_a:hover]:text-cyan-500 [&_a:hover]:decoration-cyan-400 [&_a]:transition-colors
                    /* 特定商取引法テーブルのスタイリング */
                    [&_.legal-table]:w-full [&_.legal-table]:border-collapse [&_.legal-table]:mt-6 [&_.legal-table]:mb-8 [&_.legal-table]:bg-slate-50/50 [&_.legal-table]:rounded-xl [&_.legal-table]:overflow-hidden [&_.legal-table]:border [&_.legal-table]:border-slate-100
                    [&_.legal-table_th]:text-left [&_.legal-table_th]:p-4 [&_.legal-table_th]:border-b [&_.legal-table_th]:border-slate-100 [&_.legal-table_th]:bg-slate-100/50 [&_.legal-table_th]:text-slate-800 [&_.legal-table_th]:font-bold [&_.legal-table_th]:w-[35%] [&_.legal-table_th]:text-[13px]
                    [&_.legal-table_td]:text-left [&_.legal-table_td]:p-4 [&_.legal-table_td]:border-b [&_.legal-table_td]:border-slate-100 [&_.legal-table_td]:text-slate-600 [&_.legal-table_td]:text-[13px]
                    [&_.legal-table_tr:last-child_th]:border-b-0 [&_.legal-table_tr:last-child_td]:border-b-0
                `}
                dangerouslySetInnerHTML={{ 
                    __html: content || '<p class="text-center py-10 opacity-50">詳細情報は現在準備中です。</p>' 
                }}
            />
        </BaseDialog>
    );
};
