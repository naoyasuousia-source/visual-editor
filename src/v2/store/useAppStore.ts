import { create } from 'zustand';

interface AppState {
    // Zoom
    zoomLevel: number;
    setZoomLevel: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;

    // Page Margin
    pageMargin: 's' | 'm' | 'l';
    setPageMargin: (size: 's' | 'm' | 'l') => void;

    // Word Mode
    isWordMode: boolean;
    toggleWordMode: () => void;
    setWordMode: (isWordMode: boolean) => void;

    // Dialogs
    activeDialog: string | null;
    openDialog: (dialogId: string) => void;
    closeDialog: () => void;

    // Menus
    activeMenu: string | null;
    setActiveMenu: (menuId: string | null) => void;

    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;

    // SubHelp Dialog
    subHelpData: { isOpen: boolean; type: string | null };
    openSubHelp: (type: string) => void;
    closeSubHelp: () => void;

    // File Handle (for Ctrl+S overwrite)
    currentFileHandle: FileSystemFileHandle | null;
    setCurrentFileHandle: (handle: FileSystemFileHandle | null) => void;

    // Jump Input Focus (for Ctrl+J)
    shouldFocusJumpInput: boolean;
    triggerJumpInputFocus: () => void;
    resetJumpInputFocus: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // ... (previous props)
    zoomLevel: 100,
    setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
    zoomIn: () => set((state) => ({ zoomLevel: Math.min(200, state.zoomLevel + 10) })),
    zoomOut: () => set((state) => ({ zoomLevel: Math.max(50, state.zoomLevel - 10) })),

    pageMargin: 'm',
    setPageMargin: (size) => {
        const marginMap = { s: '12mm', m: '17mm', l: '24mm' };
        document.documentElement.style.setProperty('--page-margin', marginMap[size]);
        set({ pageMargin: size });
    },

    isWordMode: localStorage.getItem('ailing_editor_mode') === 'word',
    toggleWordMode: async () => {
        // v1互換の挙動: 切り替え時に確認を出し、許可されたらリフレッシュ
        const currentState = useAppStore.getState().isWordMode;
        const nextMode = !currentState ? 'word' : 'standard';
        
        const msg = nextMode === 'word'
            ? 'Word互換モードに切り替えまますか？\n現在の編集内容は破棄されます。'
            : '通常モードに切り替えますか？\n現在の編集内容は破棄されます。';

        if (window.confirm(msg)) {
            localStorage.setItem('ailing_editor_mode', nextMode);
            window.location.reload();
        }
    },
    setWordMode: (isWordMode) => {
        localStorage.setItem('ailing_editor_mode', isWordMode ? 'word' : 'standard');
        set({ isWordMode });
    },

    activeDialog: null,
    openDialog: (dialogId) => set({ activeDialog: dialogId }),
    closeDialog: () => set({ activeDialog: null }),

    // Menus
    activeMenu: null,
    setActiveMenu: (menuId) => set({ activeMenu: menuId }),

    // Sidebar
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    // SubHelp Dialog
    subHelpData: { isOpen: false, type: null },
    openSubHelp: (type) => set({ subHelpData: { isOpen: true, type } }),
    closeSubHelp: () => set({ subHelpData: { isOpen: false, type: null } }),

    // File Handle
    currentFileHandle: null,
    setCurrentFileHandle: (handle) => set({ currentFileHandle: handle }),

    // Jump Input Focus
    shouldFocusJumpInput: false,
    triggerJumpInputFocus: () => set({ shouldFocusJumpInput: true }),
    resetJumpInputFocus: () => set({ shouldFocusJumpInput: false }),
}));
