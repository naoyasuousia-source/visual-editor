import React from 'react';
import { useAppStore } from '../store/useAppStore';

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
        // Close Help Dialog and Open Donate Dialog
        // onClose(); // Prop close might be sufficient, but we want to switch active dialog
        openDialog('donate');
        // Legacy behavior scrolled to profile, but opening dialog is first step
        // We might need a way to pass 'scrollTarget' but for now just open it.
    };

    return (
        <dialog id="help-dialog" className="open" style={{ display: 'block' }}>
            <form method="dialog">
                <div className="hint-header">
                    <h1 id="help-dialog-label">真のAI編集アシスト体験へ</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" id="dev-profile-link" className="header-link-button" onClick={handleDevProfileClick}>開発者プロフィール 👤</button>
                        <button type="button" className="close-button" onClick={onClose} aria-label="閉じる">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="hint-body">
                    <section className="hint-section">
                        <p className="hint-desc" style={{ textAlign: 'left' }}>
                            生成AIがdocx・pdfのページ区切りや段落番号を把握できず、快適な編集アシストができないという問題を解決。<br />
                            本エディターで保存したHTMLファイルをアップロードすると、ページ・段落構成を完全に生成AIと共有できます。
                        </p>
                    </section>

                    <section className="hint-section">
                        <h2 className="hint-title">生成AI連携方法</h2>
                        <div className="hint-workflow-container">
                            <img src="/image/work-flow.png" alt="生成AI連携方法ワークフロー" className="hint-workflow-img" />
                        </div>
                    </section>

                    <section className="hint-section standard-only">
                        <h2 className="hint-title">PDF出力</h2>
                        <div className="hint-pdf-box">
                            <div className="pdf-icon-container" title="PDF出力">
                                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="12" y1="18" x2="12" y2="12"></line>
                                    <polyline points="9 15 12 18 15 15"></polyline>
                                </svg>
                            </div>
                            <p className="hint-desc" style={{ textAlign: 'left' }}>
                                エディタ上のレイアウトを維持したPDF出力が可能です。印刷ダイアログで<span style={{ color: '#dc2626', fontWeight: 'bold' }}>「PDFに保存」</span>を選択し、必ず<span style={{ color: '#dc2626', fontWeight: 'bold' }}>「背景のグラフィック」</span>をONにして出力してください。
                            </p>
                        </div>
                    </section>

                    <div className="hint-footer">
                        <div className="hint-links">
                            <a href="#" onClick={(e) => handleSubHelpClick(e, '利用規約')}>利用規約</a>
                            <a href="#" onClick={(e) => handleSubHelpClick(e, 'プライバシーポリシー')}>プライバシーポリシー</a>
                            <a href="#" onClick={(e) => handleSubHelpClick(e, 'お問い合わせ')}>お問い合わせ</a>
                            <a href="#" onClick={(e) => handleSubHelpClick(e, '特定商取引法に基づく表記')}>特定商取引法に基づく表記</a>
                        </div>
                        <p className="copyright-text">&copy; 2025 AI-Link Editor&nbsp;&nbsp;β版</p>
                    </div>
                </div>
            </form>
        </dialog>
    );
};
