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

    // To maintain existing simple API or use single active dialog?
    // Let's use a structured object or individual booleans if we want to mimic the previous granular control, 
    // OR just use activeDialog ID which is cleaner (allows only one dialog at a time, which is usually UX best practice).
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
}));
