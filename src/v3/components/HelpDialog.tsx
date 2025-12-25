import React from 'react';

interface HelpDialogProps {
    onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
    return (
        <dialog id="help-dialog" className="open" style={{ display: 'block' }}>
            <form method="dialog">
                <div className="hint-header">
                    <h1 id="help-dialog-label">真のAI編集アシスト体験へ</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" id="dev-profile-link" className="header-link-button">開発者プロフィール 👤</button>
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

                    {/* ... その他のセクション（PDF出力など）も必要に応じて再現 */}
                </div>

                <div className="hint-footer">
                    <div className="hint-links">
                        <a href="#">利用規約</a>
                        <a href="#">プライバシーポリシー</a>
                        <a href="#">お問い合わせ</a>
                    </div>
                    <p className="copyright-text">&copy; 2025 AI-Link Editor&nbsp;&nbsp;β版</p>
                </div>
            </form>
        </dialog>
    );
};
