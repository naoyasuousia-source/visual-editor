function findParagraphWrapper(paragraph) {
      if (!paragraph) return null;
      return Array.from(paragraph.children).find(child => {
        return child.classList && child.classList.contains('inline-align');
      }) || null;
    }

    function ensureParagraphWrapper(paragraph) {
      let wrapper = findParagraphWrapper(paragraph);
      if (wrapper) return wrapper;
      const fragment = document.createDocumentFragment();
      while (paragraph.firstChild) {
        fragment.appendChild(paragraph.firstChild);
      }
      wrapper = document.createElement('span');
      wrapper.classList.add('inline-align');
      wrapper.appendChild(fragment);
      paragraph.appendChild(wrapper);
      return wrapper;
    }

    const alignDirections = ['left', 'center', 'right'];

    function ensureFigureWrapper(paragraph) {
      if (!paragraph) return null;
      const wrapper = ensureParagraphWrapper(paragraph);
      if (!wrapper) return null;
      alignDirections.forEach(dir => {
        wrapper.classList.remove(`inline-align-${dir}`);
      });
      wrapper.classList.add('inline-align-center', 'figure-inline');
      return wrapper;
    }

    function convertParagraphToTag(paragraph, tag) {
      if (!paragraph) return null;
      // mini-p の場合は常に p タグとして扱う
      const desiredTag = tag === 'mini-p' ? 'p' : tag;
      const currentTag = paragraph.tagName.toLowerCase();

      let replacement = paragraph; // デフォルトでは元の段落をそのまま使用

      // タグの変更が必要な場合
      if (currentTag !== desiredTag) {
        replacement = document.createElement(desiredTag);
        Array.from(paragraph.attributes).forEach(attr => {
          replacement.setAttribute(attr.name, attr.value);
        });
        // 古いparagraphの子ノードを新しいreplacementに移動
        while (paragraph.firstChild) {
          replacement.appendChild(paragraph.firstChild);
        }
        paragraph.parentNode.replaceChild(replacement, paragraph);
      }

      // mini-p のロジック
      if (tag === 'mini-p') { // tag === 'mini-p' の場合のみ処理
        // 現在のreplacementの子要素が既にmini-textでラップされているかチェック
        // :scope > .mini-text は直下の子要素のみを対象とする
        let miniTextSpan = replacement.querySelector(':scope > .mini-text');
        if (miniTextSpan) {
          // 既にラップされている場合は、style="font-size:8pt"を確実に適用
          miniTextSpan.style.fontSize = '8pt';
          // 既存の mini-text にもクラスを付与 (互換性のため)
          if (!miniTextSpan.classList.contains('mini-text')) {
            miniTextSpan.classList.add('mini-text');
          }
        } else {
          // まだラップされていない場合は、全ての子ノードをmini-textでラップ
          const fragment = document.createDocumentFragment();
          while (replacement.firstChild) {
            fragment.appendChild(replacement.firstChild);
          }
          miniTextSpan = document.createElement('span');
          miniTextSpan.className = 'mini-text';
          miniTextSpan.style.fontSize = '8pt'; // インラインスタイルを直接適用
          miniTextSpan.appendChild(fragment);
          replacement.appendChild(miniTextSpan);
        }
        replacement.dataset.blockStyle = 'mini-p'; // blockStyleはmini-pを維持
      } else {
        // mini-p から別のタグに（またはpに）戻す場合
        let miniTextSpan = replacement.querySelector(':scope > .mini-text');
        if (miniTextSpan) {
          // mini-text span が存在すれば unwrap
          while (miniTextSpan.firstChild) {
            replacement.insertBefore(miniTextSpan.firstChild, miniTextSpan);
          }
          replacement.removeChild(miniTextSpan);
        }
        replacement.dataset.blockStyle = desiredTag; // 通常のタグ名に設定
      }
      return replacement;
    }