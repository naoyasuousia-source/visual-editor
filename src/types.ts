
// Basic types for editor alignment and positioning
export type AlignDirection = 'left' | 'center' | 'right';

export type SelectionState = {
    startBlockId: string;
    endBlockId: string;
    startOffset: number;
    endOffset: number;
};

export type ParagraphPosition = {
    block: Element;
    id: string;
    offset: number;
};

export type TextPosition = {
    node: Node;
    offset: number;
};

declare global {
    interface Window {
        isParagraphEmpty: (block: Element | null | undefined) => boolean;
        findParagraphWrapper: (paragraph: Element | null) => HTMLElement | null;
        ensureParagraphWrapper: (paragraph: Element) => HTMLElement;
        ensureFigureWrapper: (paragraph: Element | null) => HTMLElement | null;
        convertParagraphToTag: (paragraph: Element | null, tag: string) => HTMLElement | null;
        currentEditor: HTMLElement | null;
        syncToSource: () => void;
        generateBookmarkId: () => string;
        getCaretOffset: (range: Range) => number;
        insertInlineTabAt: (range: Range, width: number) => boolean;
        handleInlineTabKey: () => boolean;
        handleInlineTabBackspace: () => boolean;
        addLinkDestination: () => void;
        createLink: () => void;
        removeLink: () => void;
        updateMarginRule: (value: string) => void;
        updateMarginButtonState: (activeSize: string) => void;
        applyPageMargin: (size: string) => void;
        applyParagraphAlignment: (direction: string) => void;
        alignDirections: readonly AlignDirection[];
        getParagraphsInRange: (range: Range | null) => HTMLElement[];
        applyParagraphSpacing: (size?: string | null) => void;
        applyLineHeight: (size?: string | null) => void;
        toggleBold: () => void;
        toggleItalic: () => void;
        toggleUnderline: () => void;
        toggleStrikeThrough: () => void;
        applyInlineScript: (command: string) => void;
        toggleSuperscript: () => void;
        toggleSubscript: () => void;
        closeAllFontSubmenus: () => void;
        setFontMenuOpen: (open: boolean) => void;
        toggleFontMenu: () => void;
        closeFontMenu: () => void;
        closeFontSubmenu: (type?: string | null) => void;
        closeAllParagraphSubmenus: () => void;
        setParagraphMenuOpen: (open: boolean) => void;
        toggleParagraphMenu: () => void;
        closeParagraphMenu: () => void;
        toggleFileDropdown: () => void;
        closeNestedDropdown: () => void;
        closeFileDropdown: () => void;
        setHighlightPaletteOpen: (open: boolean) => void;
        toggleHighlightPalette: () => void;
        applyColorHighlight: (color?: string | null) => void;
        applyFontColor: (color?: string | null) => void;
        resetFontColorInSelection: () => void;
        removeHighlightsInRange: (range: Range) => boolean;
        saveTextSelectionFromEditor: () => void;
        getEffectiveTextRange: () => Range | null;
        calculateOffsetWithinNode: (root: Node | null, container: Node | null, offset: number) => number | null;
        isRangeInsideCurrentEditor: (range: Range | null | undefined) => boolean;
        compareParagraphOrder: (a: Node, b: Node) => number;
        computeSelectionStateFromRange: (range: Range | null) => SelectionState | null;
        findTextPositionInParagraph: (block: Element | null, targetOffset: number) => TextPosition | null;
        restoreRangeFromSelectionState: (state: SelectionState | null) => Range | null;
        findParagraph: (node: Node | null) => Element | null;
        applyImageSize: (img: HTMLElement | null, size?: string | null) => void;
        ensureAiImageIndex: () => void;
        rebuildFigureMetaStore: () => void;
        getClosestBlockId: (element: Element | null) => string;
        showImageContextMenu: (event: MouseEvent, img: HTMLImageElement) => void;
        closeImageContextMenu: () => void;
        closeImageSubmenu: () => void;
        openTitleDialog: () => void;
        closeTitleDialog: () => void;
        applyImageTitle: () => void;
        removeExistingImageTitle: (img: HTMLImageElement | null) => void;
        updateImageMetaTitle: (img: HTMLImageElement | null, title: string) => void;
        toggleHangingIndent: (shouldHang: boolean) => void;
        applyFontFamily: (family: string | null | undefined) => void;
        applyBlockElement: (tag: string | null | undefined) => void;
        changeIndent: (delta: number) => void;
        addPage: () => void;
        removePage: () => void;
        saveFullHTML: () => void;
        openWithFilePicker: () => Promise<boolean>;
        promptDropboxImageUrl: () => void;
        promptWebImageUrl: () => void;
        overwriteCurrentFile: () => Promise<void>;
        initPages: () => void;
        renumberPages: () => void;
        resetHighlightsInSelection: () => void;
        createPage: (pageNumber: number, contentHTML?: string) => HTMLElement;
        setActiveEditor: (inner: HTMLElement | null) => void;
        bindEditorEvents: (inner: HTMLElement) => void;
        placeCaretBefore: (node: Element | null) => void;
        placeCaretAfter: (node: Element | null) => void;
        getCurrentParagraph: () => Element | null;
        renumberParagraphs: () => void;
        insertImageAtCursor: (args: { src: string; alt: string }) => void;
        updateToolbarState: () => void;
        applyPendingBlockTag: (inner: HTMLElement) => void;

        // Phase 4 Extensions
        setPagesHTML: (html: string) => void;
        importFullHTMLText: (text: string) => boolean;
        handleOpenFile: (event: Event) => void;
        buildFullHTML: () => string;
    }
}
