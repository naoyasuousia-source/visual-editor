pagesContainer.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      // contentEditable内での通常のクリックはリンクとして機能しないため、ここでハンドリングする
      if (link && link.href && event.target.closest('[contenteditable="true"]')) {
        event.preventDefault(); // デフォルトの編集動作（キャレット移動など）をキャンセル

        const href = link.getAttribute('href');
        // ページ内リンクの場合
        if (href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // 外部リンクの場合は新しいタブで開く
          window.open(link.href, '_blank', 'noopener,noreferrer');
        }
      }
    });