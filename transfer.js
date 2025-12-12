function toggleFileDropdown() {
      if (!fileDropdown) return;
      fileDropdown.classList.toggle('open');
    }

    function closeNestedDropdown() {
      nestedDropdowns.forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector('.nested-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    function closeFileDropdown() {
      if (!fileDropdown) return;
      fileDropdown.classList.remove('open');
      closeNestedDropdown();
    }

    if (fileTrigger) {
      fileTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFileDropdown();
      });
    }

    nestedTriggers.forEach(trigger => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const dropdown = trigger.closest('.nested-dropdown');
        if (!dropdown) return;
        const willOpen = !dropdown.classList.contains('open');
        closeNestedDropdown();
        dropdown.classList.toggle('open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });