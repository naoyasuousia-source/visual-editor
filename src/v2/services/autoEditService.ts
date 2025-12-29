import { Editor } from '@tiptap/react';
import { saveHtmlFile } from '@/services/fileService';
import { buildFullHTML } from '@/utils/aiMetadata';
import { Command, ExecutionResult } from '@/types/ai-sync.types';

/**
 * 現在のエディタの状態でファイルを上書き保存して保護する
 */
export async function protectDocument(
  editor: Editor,
  handle: FileSystemFileHandle,
  isWordMode: boolean,
  pageMargin: string,
  contentCssText: string
): Promise<void> {
  const marginMap: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
  const pageMarginText = marginMap[pageMargin] || '17mm';
  const aiImageIndexHtml = document.getElementById('ai-image-index')?.outerHTML || '';
  
  const fullHtml = buildFullHTML(editor, isWordMode, contentCssText, pageMarginText, aiImageIndexHtml);
  
  await saveHtmlFile(handle, fullHtml);
}

/**
 * 編集結果をファイルに保存する
 */
export async function saveExecutionResult(
  editor: Editor,
  handle: FileSystemFileHandle,
  isWordMode: boolean,
  pageMargin: string,
  contentCssText: string
): Promise<string> {
  const marginMap: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
  const pageMarginText = marginMap[pageMargin] || '17mm';
  
  const aiImageIndexHtml = document.getElementById('ai-image-index')?.outerHTML || '';
  
  const fullHtml = buildFullHTML(
    editor,
    isWordMode,
    contentCssText,
    pageMarginText,
    aiImageIndexHtml
  );

  await saveHtmlFile(handle, fullHtml);
  return fullHtml;
}
