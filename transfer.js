function closeAllFontSubmenus() {
      if (!fontChooser) return;
      fontChooser.querySelectorAll('.font-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.font-submenu-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    function setFontMenuOpen(open) {
      if (!fontChooser) return;
      fontChooser.classList.toggle('is-open', open);
      if (fontChooserTrigger) {
        fontChooserTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (!open) {
        closeAllFontSubmenus();
      }
    }

    function toggleFontMenu() {
      if (!fontChooser) return;
      const willOpen = !fontChooser.classList.contains('is-open');
      setFontMenuOpen(willOpen);
    }

    function closeFontMenu() {
      setFontMenuOpen(false);
    }

    function closeFontSubmenu(type) {
      if (!fontChooser || !type) return;
      const submenu = fontChooser.querySelector(`.font-submenu[data-submenu="${type}"]`);
      if (!submenu) return;
      submenu.classList.remove('is-open');
      const trigger = submenu.querySelector('.font-submenu-trigger');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    }
