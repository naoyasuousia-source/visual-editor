function closeAllParagraphSubmenus() {
      if (!paragraphChooser) return;
      paragraphChooser.querySelectorAll('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.paragraph-submenu-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    function setParagraphMenuOpen(open) {
      if (!paragraphChooser) return;
      paragraphChooser.classList.toggle('is-open', open);
      if (paragraphTrigger) {
        paragraphTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (!open) {
        closeAllParagraphSubmenus();
      }
    }

    function toggleParagraphMenu() {
      if (!paragraphChooser) return;
      const willOpen = !paragraphChooser.classList.contains('is-open');
      setParagraphMenuOpen(willOpen);
    }

    function closeParagraphMenu() {
      setParagraphMenuOpen(false);
    }