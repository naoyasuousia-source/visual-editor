
import {
  renumberParagraphs
} from './editor/formatting.js';

import {
  handleOpenFile
} from './editor/io.js';

import {
  initPages
} from './editor/page.js';

import {
  ensureAiImageIndex,
  initImageContextMenuControls
} from './editor/image.js';

import {
  bindEditorEvents,
  initPageLinkHandler,
  bindDocumentLevelHandlers
} from './ui/events.js';

import {
  bindToolbarHandlers
} from './ui/toolbar.js';

import {
  initFileMenuControls,
  initFontChooserControls,
  bindParagraphMenuListeners
} from './ui/menu.js';

import { applyPageMargin } from './ui/settings.js';

// Phase 1: Core Utilities Implementation
// (Moved to editor/core.ts and registry.ts)

// Phase 3: Formatting & Selection Implementation
// (Imported modules handle logic)
// (Global assignments are in registry.ts)

export function initEditor() {
  initFileMenuControls();
  initImageContextMenuControls();
  initPageLinkHandler();
  initFontChooserControls();
  bindParagraphMenuListeners();

  // Ensure file input listener is bound
  const openFileInput = document.getElementById('open-file-input');
  if (openFileInput) {
    openFileInput.removeEventListener('change', handleOpenFile);
    openFileInput.addEventListener('change', handleOpenFile);
  }

  bindDocumentLevelHandlers();
  bindToolbarHandlers();

  // Initial settings
  ensureAiImageIndex();
  applyPageMargin('m');

  // Direct initialization instead of window lookup
  initPages();
  renumberParagraphs();

  // Late import of registry to ensure exports are ready
  import('./registry.js')
    .then(() => console.log('Registry loaded'))
    .catch(err => console.error('Failed to load registry', err));

  console.log("initEditor() completed.");
}
