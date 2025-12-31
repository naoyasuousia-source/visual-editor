import React from 'react';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { useAppStore } from '@/store/useAppStore';
import { User, FileDown, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface HelpDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * ユーザー向けヘルプ・ガイドダイアログ（v1のデザインを完全再現）
 */
export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
    const { openSubHelp, openDialog, isWordMode } = useAppStore();

    const handleSubHelpClick = (e: React.MouseEvent<HTMLAnchorElement>, type: string) => {
        e.preventDefault();
        openSubHelp(type);
    };

    const handleDevProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClose(); // 自身を閉じてからドネートダイアログを開く
        setTimeout(() => {
            openDialog('donate');
        }, 100);
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title={
                <div className="flex items-center justify-between w-full">
                    <span className="text-[1.5rem] font-bold text-cyan-600 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">
                        真のAI編集アシスト体験へ
                    </span>
                    <button 
                        type="button" 
                        className="mr-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-900 text-sm font-extrabold hover:bg-orange-100 transition-all shadow-sm active:scale-95" 
                        onClick={handleDevProfileClick}
                    >
                        <span>開発者プロフィール</span>
                        <User className="w-4 h-4 fill-orange-900/10" />
                    </button>
                </div>
            }
            maxWidth="xl"
            titleClassName="w-full"
        >
            <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-4 scrollbar-thin scrollbar-thumb-gray-200 font-['Noto_Sans_JP',sans-serif]">
                {/* Introduction Section */}
                <section className="pb-8 border-b border-slate-100">
                    <p className="text-[15px] leading-relaxed text-slate-600 font-medium">
                        生成AIがdocx・pdfのページ区切りや段落番号を把握できず、快適な編集アシストができないという問題を解決。<br />
                        本エディターで保存したHTMLファイルをアップロードすると、ページ・段落構成を完全に生成AIと共有できます。
                        これにより、AIアシストによる、快適でスピーディーな編集が可能になります。
                    </p>
                    <div className="mt-4">
                        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md mb-1">
                            ※現在β版につき、全機能を無料で公開中です！
                        </span>
                        <p className="text-[13px] text-slate-500 font-medium">
                            皆さんのフィードバックを元に改善していきたいので、ぜひ今のうちに使い倒してみてください。
                        </p>
                    </div>
                </section>

                {/* Workflow Section */}
                <section className="pb-8 border-b border-slate-100 space-y-4">
                    <h2 className="text-[1.25rem] font-bold text-cyan-600">生成AI連携方法</h2>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                        <img 
                            src="/image/work-flow.png" 
                            alt="生成AI連携方法ワークフロー" 
                            className="w-full h-auto block" 
                        />
                    </div>
                </section>

                {/* Conditional Section: PDF (Standard) or Word (Word Mode) */}
                <section className="pb-8 border-b border-slate-100 space-y-4">
                    {!isWordMode ? (
                        <>
                            <h2 className="text-[1.25rem] font-bold text-cyan-600">PDF出力</h2>
                            <div className="flex gap-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex-shrink-0 w-16 h-16 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100">
                                    <FileDown className="w-10 h-10 text-cyan-600" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                                        エディタ上のレイアウトを維持したPDF出力が可能です。印刷ダイアログで
                                        <strong className="text-red-600 mx-1">「PDFに保存」</strong>
                                        を選択し、必ず
                                        <strong className="text-red-600 mx-1">「背景のグラフィック」</strong>
                                        をONにして出力してください。
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-[1.25rem] font-bold text-cyan-600">Word互換機能</h2>
                            <div className="flex gap-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex-shrink-0 w-16 h-16 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100">
                                    <div className="relative">
                                        <FileText className="w-10 h-10 text-cyan-600" />
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-cyan-100 shadow-sm">
                                            <ExternalLink className="w-3 h-3 text-cyan-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                                        Wordへの貼り付けは、エディタ上で<strong className="text-red-600 mx-1">Ctrl+A → Ctrl+C</strong>を行い、Word側で<strong className="text-red-600 mx-1">Ctrl+V</strong>で貼り付けてください。<br />
                                        Wordファイルを読み込む場合は、「Wordファイル(docx)を開く」メニューからインポートしてください。
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Footer Links & Copyright */}
                <div className="pt-2 pb-4 space-y-6">
                    <nav className="flex flex-wrap items-center justify-start gap-x-8 gap-y-3">
                        <a href="#" className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors underline decoration-slate-200 underline-offset-4" onClick={(e) => handleSubHelpClick(e, '利用規約')}>利用規約</a>
                        <a href="#" className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors underline decoration-slate-200 underline-offset-4" onClick={(e) => handleSubHelpClick(e, 'プライバシーポリシー')}>プライバシーポリシー</a>
                        <a href="#" className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors underline decoration-slate-200 underline-offset-4" onClick={(e) => handleSubHelpClick(e, 'お問い合わせ')}>お問い合わせ</a>
                        <a href="#" className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors underline decoration-slate-200 underline-offset-4" onClick={(e) => handleSubHelpClick(e, '特定商取引法に基づく表記')}>特定商取引法に基づく表記</a>
                    </nav>
                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-6">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            &copy; 2025 AI-Link Editor β版
                        </p>
                        <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-black italic">v2.0 PREVIEW</span>
                        </div>
                    </div>
                </div>
            </div>
        </BaseDialog>
    );
};
