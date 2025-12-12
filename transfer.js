function isRangeInsideCurrentEditor(range) {
      return !!(currentEditor && range && currentEditor.contains(range.commonAncestorContainer));
    }

    function saveTextSelectionFromEditor() {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      if (!isRangeInsideCurrentEditor(range)) return;
      const state = computeSelectionStateFromRange(range);
      if (state) {
        lastSelectionState = state;
      }
    }

    function getEffectiveTextRange() {
      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed && isRangeInsideCurrentEditor(range)) {
          const state = computeSelectionStateFromRange(range);
          if (state) {
            lastSelectionState = state;
            return range.cloneRange();
          }
        }
      }
      if (lastSelectionState) {
        const restored = restoreRangeFromSelectionState(lastSelectionState);
        if (restored && isRangeInsideCurrentEditor(restored)) {
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(restored);
          }
          return restored.cloneRange();
        }
      }
      return null;
    }

    function compareParagraphOrder(a, b) {
      if (a === b) return 0;
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    }

    function calculateOffsetWithinNode(root, container, offset) {
      if (!root || !container) return null;
      try {
        const temp = document.createRange();
        temp.setStart(root, 0);
        temp.setEnd(container, offset);
        return temp.toString().length;
      } catch (err) {
        return null;
      }
    }

    function computeSelectionStateFromRange(range) {
      if (!range) return null;
      const startParagraph = findParagraph(range.startContainer);
      const endParagraph = findParagraph(range.endContainer);
      if (!startParagraph || !endParagraph) return null;
      const startId = startParagraph.id;
      const endId = endParagraph.id;
      if (!startId || !endId) return null;
      const startOffset = calculateOffsetWithinNode(startParagraph, range.startContainer, range.startOffset);
      const endOffset = calculateOffsetWithinNode(endParagraph, range.endContainer, range.endOffset);
      if (startOffset == null || endOffset == null) return null;

      let startState = { block: startParagraph, id: startId, offset: startOffset };
      let endState = { block: endParagraph, id: endId, offset: endOffset };
      const order = compareParagraphOrder(startParagraph, endParagraph);
      if (order > 0 || (order === 0 && startOffset > endOffset)) {
        [startState, endState] = [endState, startState];
      }

      return {
        startBlockId: startState.id,
        endBlockId: endState.id,
        startOffset: startState.offset,
        endOffset: endState.offset
      };
    }

    function findTextPositionInParagraph(block, targetOffset) {
      if (!block) return null;
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      let node = walker.nextNode();
      let remaining = Math.max(0, targetOffset);
      while (node) {
        const textLength = node.textContent.length;
        if (remaining <= textLength) {
          return { node, offset: remaining };
        }
        remaining -= textLength;
        node = walker.nextNode();
      }
      const fallbackOffset = Math.min(Math.max(remaining, 0), block.childNodes.length);
      return { node: block, offset: fallbackOffset };
    }

    function restoreRangeFromSelectionState(state) {
      if (!state) return null;
      const startBlock = document.getElementById(state.startBlockId);
      const endBlock = document.getElementById(state.endBlockId);
      if (!startBlock || !endBlock) return null;
      const startPosition = findTextPositionInParagraph(startBlock, state.startOffset);
      const endPosition = findTextPositionInParagraph(endBlock, state.endOffset);
      if (!startPosition || !endPosition) return null;
      const range = document.createRange();
      range.setStart(startPosition.node, startPosition.offset);
      range.setEnd(endPosition.node, endPosition.offset);
      return range;
    }