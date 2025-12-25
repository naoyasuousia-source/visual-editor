import React from 'react';

interface FileMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({ isOpen, onToggle, onClose }) => {
    return (
        <div className={`file-menu ${isOpen ? 'is-open' : ''}`}>
            <button
                type="button"
                className="file-trigger"
                onClick={onToggle}
            >ファイル ▾</button>
            {isOpen && (
                <div className="file-dropdown open" role="menu" aria-label="File options">
                    <button type="button" data-action="save">保存<span className="shortcut-key">ctrl+S</span></button>
                    <button type="button" data-action="save-as">名前を付けて保存</button>
                    <button type="button" data-action="overwrite">上書き保存<span className="shortcut-key">ctrl+S</span></button>
                    <button type="button" data-action="open-html">HTMLファイルを開く<span className="shortcut-key">ctrl+O</span></button>
                    <button type="button" data-action="open-docx" className="word-only">Wordファイル(docx)を開く</button>
                    <button type="button" data-action="print" onClick={() => { window.print(); onClose(); }}>PDFとして出力</button>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">ハイパーリンク</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" data-action="add-link-destination">リンク先に追加</button>
                            <button type="button" data-action="create-link">リンクを生成</button>
                            <button type="button" data-action="remove-link">リンクを削除</button>
                        </div>
                    </div>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">画像を挿入</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" data-action="insert-image-dropbox">dropboxから挿入</button>
                            <button type="button" data-action="insert-image-web">web上の画像を挿入</button>
                        </div>
                    </div>

                    <div className="nested-dropdown">
                        <button type="button" className="nested-trigger" aria-haspopup="menu" aria-expanded="false">余白</button>
                        <div className="nested-dropdown-menu" role="menu">
                            <button type="button" data-action="page-margin" data-size="s">S</button>
                            <button type="button" data-action="page-margin" data-size="m">M</button>
                            <button type="button" data-action="page-margin" data-size="l">L</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
