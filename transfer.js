 if (fontChooserTrigger) {
      fontChooserTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFontMenu();
      });
    }

    fontSubmenuTriggers.forEach(trigger => {
      const submenu = trigger.closest('.font-submenu');
      if (!submenu) return;
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !submenu.classList.contains('is-open');
        closeAllFontSubmenus();
        submenu.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) {
          setFontMenuOpen(true);
        }
      });
    });