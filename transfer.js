const rootMarginRule = /:root\s*{[^}]*}/;

    function updateMarginRule(value) {
      if (!styleTag) return;
      if (rootMarginRule.test(styleTag.innerHTML)) {
        const formatted = `:root {\n      --page-margin: ${value};\n      --para-number-left: ${paraNumberLeft};\n    }`;
        styleTag.innerHTML = styleTag.innerHTML.replace(rootMarginRule, formatted);
      }
    }

    function updateMarginButtonState(activeSize) {
      const buttons = toolbar.querySelectorAll('button[data-action="page-margin"]');
      buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
      });
    }

    function applyPageMargin(size) {
      if (!pageMarginValues[size]) return;
      currentPageMargin = size;
      const value = pageMarginValues[size];
      document.documentElement.style.setProperty('--page-margin', value);
      document.documentElement.style.setProperty('--para-number-left', paraNumberLeft);
      updateMarginRule(value);
      updateMarginButtonState(size);
    }