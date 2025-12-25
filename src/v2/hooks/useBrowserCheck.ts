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

        const isEdge = /Edg/.test(ua);
        const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
        const isApple = /Apple Computer/.test(vendor);
        let isSupported = isEdge || (isChrome && !isApple);

        if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
            isSupported = false;
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (isMobile) {
            isSupported = false;
        }

        if (!isSupported) {
            setShowWarning(true);
        }
    }, []);

    return {
        showWarning,
        setShowWarning
    };
};
