import { useCallback } from 'react';

/**
 * 段落番号表示制御フック
 * 
 * 【重要】直接DOM操作を排除し、Reactの状態管理に統合
 */
export const useParagraphNumberToggle = () => {
    const toggleParagraphNumbers = useCallback((show: boolean) => {
        // bodyのクラス操作（CSSによる表示制御）
        if (show) {
            document.body.classList.remove('hide-para-numbers');
        } else {
            document.body.classList.add('hide-para-numbers');
        }
    }, []);

    return {
        toggleParagraphNumbers
    };
};
