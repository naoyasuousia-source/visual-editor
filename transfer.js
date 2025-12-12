 function isParagraphEmpty(block) {
      if (!block) return false;
      for (const child of block.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent.trim() !== '') return false;
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          return false;
        }
      }
      return true;
    }