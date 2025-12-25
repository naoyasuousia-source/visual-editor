import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, User, FileText, Download } from 'lucide-react';

interface HelpDialogProps {
    onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
    const { openSubHelp, openDialog } = useAppStore();

    const handleSubHelpClick = (e: React.MouseEvent<HTMLAnchorElement>, type: string) => {
        e.preventDefault();
        openSubHelp(type);
    };

    const handleDevProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openDialog('donate');
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        真のAI編集アシスト体験へ
                    </h1>
                    <div className="flex items-center gap-3">
                        <button 
                            type="button" 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors" 
                            onClick={handleDevProfileClick}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>開発者プロフィール</span>
                        </button>
                        <button 
                            type="button" 
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" 
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[80vh] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                    <section>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            生成AIがdocx・pdfのページ区切りや段落番号を把握できず、快適な編集アシストができないという問題を解決。<br />
                            本エディターで保存したHTMLファイルをアップロードすると、ページ・段落構成を完全に生成AIと共有できます。
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                            生成AI連携方法
                        </h2>
                        <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
                            <img src="/image/work-flow.png" alt="生成AI連携方法ワークフロー" className="max-h-[240px] drop-shadow-md" />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
                            PDF出力
                        </h2>
                        <div className="flex gap-4 bg-cyan-50/50 rounded-xl p-5 border border-cyan-100">
                            <div className="bg-white p-3 rounded-lg shadow-sm self-start">
                                <Download className="w-8 h-8 text-cyan-500" />
                            </div>
                            <p className="text-xs text-cyan-800 leading-relaxed">
                                エディタ上のレイアウトを維持したPDF出力が可能です。印刷ダイアログで
                                <span className="text-red-600 font-bold mx-1">「PDFに保存」</span>
                                を選び、必ず
                                <span className="text-red-600 font-bold mx-1">「背景のグラフィック」</span>
                                をONにして出力してください。
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-400 mb-4">
                        <a href="#" className="hover:text-blue-500 transition-colors" onClick={(e) => handleSubHelpClick(e, '利用規約')}>利用規約</a>
                        <a href="#" className="hover:text-blue-500 transition-colors" onClick={(e) => handleSubHelpClick(e, 'プライバシーポリシー')}>プライバシーポリシー</a>
                        <a href="#" className="hover:text-blue-500 transition-colors" onClick={(e) => handleSubHelpClick(e, 'お問い合わせ')}>お問い合わせ</a>
                        <a href="#" className="hover:text-blue-500 transition-colors" onClick={(e) => handleSubHelpClick(e, '特定商取引法に基づく表記')}>特定商取引法に基づく表記</a>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-300">&copy; 2025 AI-Link Editor β版</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <FileText className="w-3 h-3" />
                            <span>v2.0 Visual Editor</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
