export function checkBrowserSupport() {
    const ua = navigator.userAgent;
    // Check for Chrome or Edge (Chromium based)
    // Edge includes 'Edg'
    // Chrome includes 'Chrome' but Safari also includes 'Chrome' often, but strict check:
    // Chrome UA: "Mozilla/5.0 ... Chrome/XX.X ... Safari/XX.X"
    // Edge UA: "Mozilla/5.0 ... Chrome/XX.X ... Safari/XX.X Edg/XX.X"
    // Safari UA: "Mozilla/5.0 ... Version/XX.X Safari/XX.X" (No Chrome usually, or if so, very specific)
    // Simplest robust check for Chrome/Edge vs others:
    // If it has "Edg", it is Edge.
    // If it has "Chrome" AND NOT "Edg" AND NOT "OPR" => Chrome.
    // BUT user asked to warn if NOT Chrome OR Edge.
    // So valid set = { Chrome, Edge }
    const isEdge = /Edg/.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
    // Relaxed check: Many Chromium browsers like Brave use Chrome UA.
    // If user specifically wants valid "Chrome or Edge", usually they mean Chromium engine.
    // Safari does NOT have 'Chrome' in standard UA string on Desktop.
    // Firefox does NOT have 'Chrome'.
    const isSupported = isEdge || /Chrome/.test(ua);
    // Note: This 'isSupported' might include Opera (OPR) or Brave. 
    // Usually acceptable as they are Chromium. 
    // If specific strictness is needed, use:
    // const isSupported = isEdge || ( /Chrome/.test(ua) && !/OPR/.test(ua) );
    if (!isSupported) {
        const dialog = document.getElementById('browser-warning-dialog');
        if (dialog) {
            dialog.showModal();
        }
    }
}
