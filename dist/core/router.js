const STORAGE_KEY = 'ailing_editor_mode';
const HASH_STANDARD = '#/editor/standard';
const HASH_WORD = '#/editor/word';
export function getMode() {
    return localStorage.getItem(STORAGE_KEY) || 'standard';
}
function setModeInternal(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    document.body.classList.remove('mode-standard', 'mode-word');
    document.body.classList.add(`mode-${mode}`);
}
export function initRouter() {
    // 1. LocalStorage Check
    let currentMode = getMode();
    // 2. Hash Check & Validate
    // If explicit hash exists, it might override local storage (e.g. sharing link)
    // But spec says "Priority: LocalStorage". 
    // "2回目以降 ＝ 前回終了時のモード（LocalStorageの値）でURLを自動決定。"
    // So we respect LocalStorage primarily for determining the view.
    // However, ensure URL matches the mode
    const targetHash = currentMode === 'word' ? HASH_WORD : HASH_STANDARD;
    if (window.location.hash !== targetHash) {
        // If hash contradicts storage, should we update storage or URL?
        // "URLパスで完全分離... URLを検知して挙動を注入" implies URL might drive it.
        // Let's adopt a hybrid:
        // If Hash is explicit and recognized, use it. Update Storage.
        const h = window.location.hash;
        if (h === HASH_WORD) {
            currentMode = 'word';
        }
        else if (h === HASH_STANDARD) {
            currentMode = 'standard';
        }
        // If invalid or empty, we fallback to storage value logic.
    }
    // Update URL to match final decision
    const finalHash = currentMode === 'word' ? HASH_WORD : HASH_STANDARD;
    if (window.location.hash !== finalHash) {
        window.history.replaceState(null, '', finalHash);
    }
    // Apply Class
    setModeInternal(currentMode);
    // Listen for manual hash changes (Address bar edit / Back button)
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash;
        // Check if change is needed
        let nextMode = null;
        if (newHash === HASH_WORD)
            nextMode = 'word';
        if (newHash === HASH_STANDARD)
            nextMode = 'standard';
        if (nextMode && nextMode !== getMode()) {
            // If user used back button or manually changed URL, force reload to reset state
            // We do confirm just in case, or just reload?
            // Browser nav usually expects immediate action.
            // Let's just update storage and reload.
            setModeInternal(nextMode);
            window.location.reload();
        }
    });
}
export function switchMode(mode) {
    const msg = mode === 'word'
        ? 'Word互換モードに切り替えますか？\n現在の編集内容は破棄されます。'
        : '通常モードに切り替えますか？\n現在の編集内容は破棄されます。';
    if (window.confirm(msg)) {
        // Update Storage first
        localStorage.setItem(STORAGE_KEY, mode);
        // Update Hash - this triggers hashchange, or we can just reload.
        // Changing hash effectively pushes history.
        const targetHash = mode === 'word' ? HASH_WORD : HASH_STANDARD;
        window.location.hash = targetHash;
        // Reload to apply clean state
        window.location.reload();
    }
}
