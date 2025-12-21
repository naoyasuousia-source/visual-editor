import './styles/content.css';
import './styles/ui.css';
import './styles/ui_word_mode.css';

import {
  renumberParagraphs
} from './editor/formatting';

import {
  handleOpenFile
} from './editor/io';

import {
  initPages
} from './editor/page';

import {
  ensureAiImageIndex,
  initImageContextMenuControls
} from './editor/image';

import { updateAiMetaGuide } from './editor/ai-meta';

import {
  bindEditorEvents,
  initPageLinkHandler,
  bindDocumentLevelHandlers
} from './ui/events';

import {
  bindToolbarHandlers
} from './ui/toolbar';

import {
  initFileMenuControls,
  initViewMenuControls,
  initFontChooserControls,
  bindParagraphMenuListeners,
  initHighlightMenuControls,
  initHelpDialog,
  initModeSwitch,
  initWordToolbarControls
} from './ui/menu';

import { applyPageMargin } from './ui/settings';
import { initNavigator, initParagraphJump, initSidebarToggle, initToolbarJump } from './ui/navigator';

// Phase 1: Core Utilities Implementation
// (Moved to editor/core.ts and registry.ts)

// Phase 3: Formatting & Selection Implementation
// (Imported modules handle logic)
// (Global assignments are in registry.ts)

import { checkBrowserSupport } from './ui/browser-check';
import { initRouter } from './core/router';

export function initEditor() {
  initRouter();
  checkBrowserSupport();
  initFileMenuControls();
  initViewMenuControls();
  initImageContextMenuControls();
  initPageLinkHandler();
  initFontChooserControls();
  bindParagraphMenuListeners();
  initHighlightMenuControls();
  initHelpDialog();
  initModeSwitch();
  initWordToolbarControls();

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

  initNavigator();
  initParagraphJump();
  initSidebarToggle();
  initToolbarJump();

  // Initialize AI Meta Guide
  updateAiMetaGuide();

  // Late import of registry to ensure exports are ready
  import('./registry')
    .catch(err => console.error('Failed to load registry', err));
}

// 実行
initEditor();
