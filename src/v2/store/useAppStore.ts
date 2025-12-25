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

    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;

    // SubHelp Dialog
    subHelpData: { isOpen: boolean; type: string | null };
    openSubHelp: (type: string) => void;
    closeSubHelp: () => void;
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

    isWordMode: false,
    toggleWordMode: () => set((state) => ({ isWordMode: !state.isWordMode })),
    setWordMode: (isWordMode) => set({ isWordMode }),

    activeDialog: null,
    openDialog: (dialogId) => set({ activeDialog: dialogId }),
    closeDialog: () => set({ activeDialog: null }),

    // Sidebar
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    // SubHelp Dialog
    subHelpData: { isOpen: false, type: null },
    openSubHelp: (type) => set({ subHelpData: { isOpen: true, type } }),
    closeSubHelp: () => set({ subHelpData: { isOpen: false, type: null } }),
}));
