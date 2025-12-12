function getParagraphsInRange(range) {
      if (!currentEditor || !range) return [];
      const selectors = 'p, h1, h2, h3, h4, h5, h6';
      return Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
        return range.intersectsNode(paragraph);
      });
    }

    function applyParagraphAlignment(direction) {
      if (!currentEditor || !direction) return;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      if (!currentEditor.contains(range.commonAncestorContainer)) return;

      const paragraphs = getParagraphsInRange(range);
      if (!paragraphs.length) return;

      paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        if (!wrapper) return;
        alignDirections.forEach(dir => {
          wrapper.classList.remove(`inline-align-${dir}`);
        });
        if (wrapper.classList.contains('figure-inline')) {
          wrapper.classList.add('inline-align-center');
        } else {
          wrapper.classList.add(`inline-align-${direction}`);
        }
      });

      syncToSource();
    }

    const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'];
    function clearParagraphSpacingClasses(target) {
      if (!target) return;
      paragraphSpacingSizes.forEach(sz => target.classList.remove(`inline-spacing-${sz}`));
    }
    function applyParagraphSpacing(size) {
      if (!currentEditor || !size || !paragraphSpacingSizes.includes(size)) return;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      if (!currentEditor.contains(range.commonAncestorContainer)) return;

      const paragraphs = getParagraphsInRange(range);
      if (!paragraphs.length) return;

      paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        clearParagraphSpacingClasses(paragraph);
        clearParagraphSpacingClasses(wrapper);
        if (size !== 's') {
          paragraph.classList.add(`inline-spacing-${size}`);
          if (wrapper) wrapper.classList.add(`inline-spacing-${size}`);
        }
      });
      syncToSource();
    }