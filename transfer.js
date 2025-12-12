function showImageContextMenu(event, img) {
      if (!imageContextMenu) return;
      contextTargetImage = img;
      closeImageSubmenu();
      const { clientX, clientY } = event;
      const { width, height } = imageContextMenu.getBoundingClientRect();
      const maxX = window.innerWidth - width - 8;
      const maxY = window.innerHeight - height - 8;
      const x = Math.max(8, Math.min(clientX, maxX));
      const y = Math.max(8, Math.min(clientY, maxY));
      imageContextMenu.style.left = `${x}px`;
      imageContextMenu.style.top = `${y}px`;
      imageContextMenu.classList.add('open');
    }

    function closeImageContextMenu() {
      if (!imageContextMenu) return;
      imageContextMenu.classList.remove('open');
      closeImageSubmenu();
    }

    function closeImageSubmenu() {
      if (!imageContextDropdown) return;
      imageContextDropdown.classList.remove('open');
      if (imageContextTrigger) {
        imageContextTrigger.setAttribute('aria-expanded', 'false');
      }
    }

    function openTitleDialog() {
      if (!imageTitleDialog || !contextTargetImage) return;
      const block = contextTargetImage.closest('p, h1, h2, h3, h4, h5, h6');
      if (!block) return;
      let existingTitle = '';
      let sibling = contextTargetImage.nextSibling;
      while (sibling && sibling.nodeType === Node.TEXT_NODE && sibling.textContent.trim() === '') {
        sibling = sibling.nextSibling;
      }
      if (sibling && sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === 'BR') {
        const textNode = sibling.nextSibling;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          existingTitle = textNode.textContent || '';
        }
      }
      if (imageTitleInput) {
        imageTitleInput.value = existingTitle;
        imageTitleInput.focus();
        imageTitleInput.select();
      }
      // 既存のタイトルがmini-text形式かどうかを判定
      const figureTitleSpan = block.querySelector('.figure-title');
      const hasMiniTextInTitle = figureTitleSpan && figureTitleSpan.querySelector('.mini-text');
      const isBlockStyleMini = block.dataset.blockStyle === 'mini-p';

      const fontValue = (isBlockStyleMini || hasMiniTextInTitle) ? 'mini' : 'default';
      imageTitleFontRadios.forEach(radio => {
        radio.checked = radio.value === fontValue;
      });
      if (typeof imageTitleDialog.showModal === 'function') {
        imageTitleDialog.showModal();
      } else {
        imageTitleDialog.setAttribute('open', '');
      }
    }

    function closeTitleDialog() {
      if (!imageTitleDialog) return;
      if (typeof imageTitleDialog.close === 'function') {
        imageTitleDialog.close();
      } else {
        imageTitleDialog.removeAttribute('open');
      }
      if (imageTitleInput) {
        imageTitleInput.value = '';
      }
      contextTargetImage = null;
    }

    function removeExistingImageTitle(img) {
      if (!img) return;

      // 次の兄弟要素から走査して、BR, caret-slot, figure-titleを削除
      let next = img.nextSibling;
      while (next) {
        const toRemove = next;
        next = next.nextSibling; // 先に次のノードを取得

        if (toRemove.nodeType === Node.TEXT_NODE && toRemove.textContent.trim() === '') {
          toRemove.remove(); // 空のテキストノード
        } else if (toRemove.nodeType === Node.ELEMENT_NODE) {
          if (toRemove.tagName === 'BR' || toRemove.classList.contains('caret-slot') || toRemove.classList.contains('figure-title')) {
            toRemove.remove();
          } else {
            // 関係ない要素が見つかったら停止
            break;
          }
        } else {
          break;
        }
      }
    }

    function updateImageMetaTitle(img, rawTitle) {
      if (!img) return;
      ensureAiImageIndex();
      if (!aiImageIndex) return;
      let meta = Array.from(aiImageIndex.querySelectorAll('.figure-meta')).find(m => m.dataset.src === img.src);
      if (!meta) {
        rebuildFigureMetaStore();
        meta = Array.from(aiImageIndex.querySelectorAll('.figure-meta')).find(m => m.dataset.src === img.src);
      }
      if (meta) {
        meta.dataset.title = rawTitle || '';
      }
    }

    function applyImageTitle() {
      if (!contextTargetImage) return;
      const rawTitle = imageTitleInput ? imageTitleInput.value : '';
      const fontRadio = Array.from(imageTitleFontRadios).find(radio => radio.checked);
      const fontSize = fontRadio ? fontRadio.value : 'default';
      const block = contextTargetImage.closest('p, h1, h2, h3, h4, h5, h6');
      if (!block) return;

      // 画像タイトル自体は常に p タグに変換されるように
      const paragraph = block.tagName.toLowerCase() === 'p'
        ? block
        : convertParagraphToTag(block, 'p');
      if (!paragraph) return;

      const isMini = fontSize === 'mini';

      // 段落クラス 'mini-p' のトグルは削除
      // paragraph.classList.toggle('mini-p', isMini);

      // dataset.blockStyle の設定は、mini の場合は 'mini-p'、それ以外は 'p' にする
      paragraph.dataset.blockStyle = isMini ? 'mini-p' : 'p';

      const wrapper = ensureFigureWrapper(paragraph);
      removeExistingImageTitle(contextTargetImage); // 既存のタイトル関連要素を削除

      if (rawTitle) {
        const br = document.createElement('br');
        const caretSlot = document.createElement('span');
        caretSlot.className = 'caret-slot';
        caretSlot.contentEditable = 'false';
        caretSlot.innerHTML = '&#8203;'; // Zero-width space

        let titleContent;
        if (isMini) {
          // mini の場合、テキストを mini-text span でラップ
          titleContent = document.createElement('span');
          titleContent.className = 'mini-text'; // mini-text クラス
          titleContent.style.fontSize = '8pt'; // インラインスタイル
          titleContent.textContent = rawTitle;
        } else {
          // 通常のフォントサイズの場合
          titleContent = document.createTextNode(rawTitle);
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'figure-title';
        titleSpan.contentEditable = 'false';
        titleSpan.appendChild(titleContent); // ラップした要素またはテキストノードを追加

        const container = wrapper || paragraph;

        container.appendChild(caretSlot);
        container.appendChild(br);
        container.appendChild(titleSpan);
      }
      updateImageMetaTitle(contextTargetImage, rawTitle);
      syncToSource();
    }

    if (imageTitleApplyButton) {
      imageTitleApplyButton.addEventListener('click', (event) => {
        event.preventDefault();
        applyImageTitle();
        closeTitleDialog();
      });
    }

    if (imageTitleCancelButton) {
      imageTitleCancelButton.addEventListener('click', (event) => {
        event.preventDefault();
        closeTitleDialog();
      });
    }

    if (imageTitleDialog) {
      imageTitleDialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeTitleDialog();
      });
    }

    if (imageContextTrigger) {
      imageContextTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!imageContextDropdown) return;
        const willOpen = !imageContextDropdown.classList.contains('open');
        imageContextDropdown.classList.toggle('open');
        imageContextTrigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    }

    document.addEventListener('contextmenu', (event) => {
      const img = event.target.closest('img');
      if (img && pagesContainer.contains(img)) {
        event.preventDefault();
        event.stopPropagation();
        showImageContextMenu(event, img);
        return;
      }
      closeImageContextMenu();
    });

    if (imageContextMenu) {
      imageContextMenu.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-action]');
        if (!btn) return;
        event.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'image-size') {
          const size = btn.dataset.size;
          applyImageSize(contextTargetImage, size);
          closeImageContextMenu();
          contextTargetImage = null;
          return;
        }
        if (action === 'image-title') {
          closeImageContextMenu();
          openTitleDialog();
          return;
        }
        closeImageContextMenu();
        contextTargetImage = null;
      });
    }

    window.addEventListener('resize', closeImageContextMenu);
    window.addEventListener('blur', closeImageContextMenu);