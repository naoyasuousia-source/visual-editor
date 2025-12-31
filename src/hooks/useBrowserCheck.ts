import { useState, useEffect } from 'react';

/**
 * ブラウザ互換性チェックのロジックを管理するカスタムフック
 * UIコンポーネントから環境判定ロジックを完全分離
 */
export const useBrowserCheck = () => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        const vendor = navigator.vendor || '';

        // Chromium系（Edgeを含む）の判定
        const isEdge = /Edg/.test(ua);
        const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
        const isApple = /Apple Computer/.test(vendor);
        
        // 推奨ブラウザ判定（Chromiumエンジンのデスクトップ版）
        const isSupportedBrowser = isEdge || (isChrome && !isApple);

        // Safari, Firefox の明示的チェック
        const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edg/.test(ua);
        const isFirefox = /Firefox/.test(ua);

        // モバイル・タブレット判定
        const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        
        // 開発環境（localhost）では警告を出さない選択肢もあるが、要件に従い判定
        if (!isSupportedBrowser || isSafari || isFirefox || isMobileOrTablet) {
            // 少し遅延させて表示（初期レンダリングの落ち着き待ち）
            const timer = setTimeout(() => {
                setShowWarning(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    return {
        showWarning,
        setShowWarning
    };
};
