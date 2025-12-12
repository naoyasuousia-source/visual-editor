const lineHeightSizes = ['s', 'm', 'l'];
    function applyLineHeight(size) {
      if (!lineHeightSizes.includes(size)) return;
      const inners = pagesContainer.querySelectorAll('.page-inner');
      inners.forEach(inner => {
        lineHeightSizes.forEach(sz => inner.classList.remove(`line-height-${sz}`));
        if (size !== 'm') {
          inner.classList.add(`line-height-${size}`);
        }
      });
      syncToSource();
    }