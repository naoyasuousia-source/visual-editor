function setHighlightPaletteOpen(open) {
      if (!highlightControl || !highlightButton) return;
      highlightControl.classList.toggle('is-open', open);
      highlightButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function toggleHighlightPalette() {
      if (!highlightControl) return;
      setHighlightPaletteOpen(!highlightControl.classList.contains('is-open'));
    }

    function applyColorHighlight(color) {
      if (!currentEditor || !color) return;

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      if (!currentEditor.contains(range.commonAncestorContainer)) return;

      const cleanupRange = range.cloneRange();
      if (removeHighlightsInRange(cleanupRange)) {
        selection.removeAllRanges();
        selection.addRange(cleanupRange);
      }

      const workingRange = cleanupRange.cloneRange();

      const fragment = workingRange.extractContents();

      const span = document.createElement('span');
      span.className = 'inline-highlight';
      span.style.backgroundColor = color;
      span.appendChild(fragment);
      workingRange.insertNode(span);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);

      syncToSource();
      setHighlightPaletteOpen(false);
    }

    function unwrapColorSpan(span) {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    }

    function removeColorSpansInNode(root) {
      if (!root || !root.querySelectorAll) return false;
      const spans = Array.from(root.querySelectorAll('.inline-color'));
      let removed = false;
      spans.forEach(span => {
        unwrapColorSpan(span);
        removed = true;
      });
      return removed;
    }

    function cloneColorSpanWithText(template, text) {
      if (!template || !text) return null;
      const clone = template.cloneNode(false);
      while (clone.firstChild) {
        clone.removeChild(clone.firstChild);
      }
      clone.appendChild(document.createTextNode(text));
      return clone;
    }

    function splitColorSpanForRange(span, range) {
      if (!span || !range || !range.intersectsNode(span)) return false;
      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);
      const intersection = range.cloneRange();
      if (intersection.compareBoundaryPoints(Range.START_TO_START, spanRange) < 0) {
        intersection.setStart(spanRange.startContainer, spanRange.startOffset);
      }
      if (intersection.compareBoundaryPoints(Range.END_TO_END, spanRange) > 0) {
        intersection.setEnd(spanRange.endContainer, spanRange.endOffset);
      }
      const totalLength = span.textContent.length;
      const startOffset = calculateOffsetWithinNode(span, intersection.startContainer, intersection.startOffset);
      const endOffset = calculateOffsetWithinNode(span, intersection.endContainer, intersection.endOffset);
      if (startOffset == null || endOffset == null) return false;
      if (startOffset <= 0 && endOffset >= totalLength) {
        unwrapColorSpan(span);
        return true;
      }

      const text = span.textContent || '';
      const beforeText = text.slice(0, startOffset);
      const middleText = text.slice(startOffset, endOffset);
      const afterText = text.slice(endOffset);

      if (!middleText) return false;

      const parent = span.parentNode;
      if (!parent) return false;

      const fragments = [];
      if (beforeText) {
        const beforeSpan = cloneColorSpanWithText(span, beforeText);
        if (beforeSpan) fragments.push(beforeSpan);
      }
      fragments.push(document.createTextNode(middleText));
      if (afterText) {
        const afterSpan = cloneColorSpanWithText(span, afterText);
        if (afterSpan) fragments.push(afterSpan);
      }

      fragments.forEach(node => parent.insertBefore(node, span));
      parent.removeChild(span);
      return true;
    }

    function resetFontColorInSelection() {
      const range = getEffectiveTextRange();
      if (!range || !currentEditor) return false;
      const colorSpans = Array.from(currentEditor.querySelectorAll('.inline-color'));
      let removed = false;
      colorSpans.forEach(span => {
        if (splitColorSpanForRange(span, range)) {
          removed = true;
        }
      });

      const selection = window.getSelection();
      if (selection) {
        const restored = restoreRangeFromSelectionState(lastSelectionState) || range;
        selection.removeAllRanges();
        selection.addRange(restored);
      }

      if (removed) {
        syncToSource();
      }
      saveTextSelectionFromEditor();
      return removed;
    }

    function applyFontColor(color) {
      if (!currentEditor || !color) return;

      const range = getEffectiveTextRange();
      if (!range) return;

      const workingRange = range.cloneRange();
      const fragment = workingRange.extractContents();
      removeColorSpansInNode(fragment);

      const span = document.createElement('span');
      span.className = 'inline-color';
      span.style.color = color;
      span.appendChild(fragment);
      workingRange.insertNode(span);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
      }

      syncToSource();
      setHighlightPaletteOpen(false);
      saveTextSelectionFromEditor();
    }
