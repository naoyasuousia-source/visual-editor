function generateBookmarkId() {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = 'bm-';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    function addLinkDestination() {
      if (!currentEditor) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        alert('テキストを選択してください。');
        return;
      }

      if (!currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
      }

      const span = document.createElement('span');
      span.id = generateBookmarkId();

      try {
        range.surroundContents(span);
      } catch (e) {
        console.error("Failed to wrap selection: ", e);
        alert("複雑な選択範囲のため、リンク先を追加できませんでした。段落をまたがない単純なテキストを選択してください。");
        return;
      }

      selection.removeAllRanges();
      syncToSource();
    }

    function createLink() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
        alert('リンクにしたいテキストを選択してください。');
        return;
      }
      const range = selection.getRangeAt(0);
      if (!currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
      }

      const destinations = Array.from(document.querySelectorAll('.page-inner [id^="bm-"]'));
      if (destinations.length === 0) {
        alert('リンク先が登録されていません。');
        return;
      }

      let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
      const destinationMap = new Map();
      destinations.forEach((dest, index) => {
        const text = dest.textContent.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\n`;
        destinationMap.set(String(index + 1), dest.id);
      });

      const choice = window.prompt(promptMessage);
      if (!choice) return; // キャンセル

      const destinationId = destinationMap.get(choice.trim());
      if (!destinationId) {
        alert('無効な番号です。');
        return;
      }

      // execCommand を使ってリンクを生成
      document.execCommand('createLink', false, '#' + destinationId);

      // aタグの後に不要なテキストノードが追加されることがあるので、正規化する
      currentEditor.normalize();

      syncToSource();
    }

    function removeLink() {
      if (!currentEditor) return;

      const links = Array.from(currentEditor.querySelectorAll('a[href^="#bm-"]'));
      if (links.length === 0) {
        alert('削除できるリンクがありません。');
        return;
      }

      let promptMessage = 'どのリンクを削除しますか？番号を入力してください。\\n\\n';
      const linkMap = new Map();
      links.forEach((link, index) => {
        const text = link.textContent.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\\n`;
        linkMap.set(String(index + 1), link);
      });

      const choice = window.prompt(promptMessage);
      if (!choice) return; // キャンセル

      const linkToRemove = linkMap.get(choice.trim());
      if (!linkToRemove) {
        alert('無効な番号です。');
        return;
      }

      // aタグを解除(unwrap)
      const parent = linkToRemove.parentNode;
      while (linkToRemove.firstChild) {
        parent.insertBefore(linkToRemove.firstChild, linkToRemove);
      }
      parent.removeChild(linkToRemove);
      parent.normalize(); // テキストノードを結合

      syncToSource();
    }