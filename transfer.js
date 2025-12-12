function toggleBold() {
      if (!currentEditor) return;
      currentEditor.focus();
      document.execCommand('bold', false, null);
      normalizeInlineFormatting();
      syncToSource();
    }

    function toggleItalic() {
      if (!currentEditor) return;
      currentEditor.focus();
      document.execCommand('italic', false, null);
      normalizeInlineFormatting();
      syncToSource();
    }

    function toggleUnderline() {
      if (!currentEditor) return;
      currentEditor.focus();
      document.execCommand('underline', false, null);
      normalizeInlineFormatting();
      syncToSource();
    }

    function toggleStrikeThrough() {
      if (!currentEditor) return;
      currentEditor.focus();
      document.execCommand('strikeThrough', false, null);
      normalizeInlineFormatting();
      syncToSource();
    }

    function applyInlineScript(command) {
      if (!currentEditor) return;
      currentEditor.focus();
      document.execCommand(command, false, null);
      syncToSource();
    }

    function toggleSuperscript() {
      applyInlineScript('superscript');
    }

    function toggleSubscript() {
      applyInlineScript('subscript');
    }