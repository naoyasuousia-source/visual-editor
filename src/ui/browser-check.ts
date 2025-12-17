
export function checkBrowserSupport(): void {
    const ua = navigator.userAgent;
    const vendor = navigator.vendor || '';

    // Robust Detection:
    // Chrome/Edge (Chromium): usually have "Google Inc." as vendor (even Edge mostly, or empty).
    // Safari: "Apple Computer, Inc."

    // We want to ALLOW Chrome or Edge.
    // We want to WARN for Safari, Firefox.

    const isEdge = /Edg/.test(ua);
    // Chrome Check: Must have "Chrome" in UA, and optionally "Google Inc." in vendor if available.
    // Safari UA on Mac *does not* contain "Chrome".
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);

    // Vendor check for safety: Apple vendor implies Safari (usually).
    const isApple = /Apple Computer/.test(vendor);

    // Final decision:
    // If it's Edge, OK.
    // If it's Chrome AND NOT Apple (some wrappers might be weird), OK.
    let isSupported = isEdge || (isChrome && !isApple);

    // Force warning if it looks like Safari
    if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
        isSupported = false;
    }

    // Mobile Check: Fail if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (isMobile) {
        isSupported = false;
    }

    if (!isSupported) {
        const dialog = document.getElementById('browser-warning-dialog') as HTMLDialogElement;
        if (dialog) {
            // Fallback for older browsers (older Safari) that don't support <dialog> or showModal
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                // Manual fallback
                dialog.setAttribute('open', 'true');
                dialog.style.display = 'block';
                dialog.style.position = 'fixed';
                dialog.style.top = '50%';
                dialog.style.left = '50%';
                dialog.style.transform = 'translate(-50%, -50%)';
                dialog.style.zIndex = '9999';
                dialog.style.background = 'white';
                dialog.style.border = '1px solid #ccc';
                dialog.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';

                // Also add a backdrop if possible (manual)
                const backdrop = document.createElement('div');
                backdrop.style.position = 'fixed';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100%';
                backdrop.style.height = '100%';
                backdrop.style.background = 'rgba(0,0,0,0.5)';
                backdrop.style.zIndex = '9998';
                document.body.appendChild(backdrop);

                // Allow closing
                const closeBtn = dialog.querySelector('button[type="submit"]');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        dialog.style.display = 'none';
                        document.body.removeChild(backdrop);
                    });
                }
            }
        }
    }
}
