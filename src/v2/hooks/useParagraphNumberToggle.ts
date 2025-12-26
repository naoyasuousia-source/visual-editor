import { useState, useCallback } from 'react';

/**
 * ページ番号・段落番号の表示制御フック
 * 
 * 【重要】DOM操作をフック内にカプセル化し、コンポーネントからの直接DOM操作を排除
 */
export const useNumberToggle = () => {
    const [showPageNumbers, setShowPageNumbers] = useState(true);
    const [showParaNumbers, setShowParaNumbers] = useState(true);

    const togglePageNumbers = useCallback((show: boolean) => {
        setShowPageNumbers(show);
        // bodyのクラス操作（CSSによる表示制御）
        if (show) {
            document.body.classList.remove('hide-page-numbers');
        } else {
            document.body.classList.add('hide-page-numbers');
        }
    }, []);

    const toggleParaNumbers = useCallback((show: boolean) => {
        setShowParaNumbers(show);
        // bodyのクラス操作（CSSによる表示制御）
        if (show) {
            document.body.classList.remove('hide-para-numbers');
        } else {
            document.body.classList.add('hide-para-numbers');
        }
    }, []);

    return {
        showPageNumbers,
        showParaNumbers,
        togglePageNumbers,
        toggleParaNumbers
    };
};

// 後方互換性のためのエイリアス
export const useParagraphNumberToggle = useNumberToggle;
