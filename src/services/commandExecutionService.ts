/**
 * 旧コマンド実行サービス
 * 後方互換性のために保持。各ハンドラは別ファイルに分割。
 */

import { executeInsertText, executeReplaceText, executeDeleteText } from './commands/oldTextHandlers';
import { executeInsertParagraph, executeDeleteParagraph } from './commands/oldParagraphHandlers';
import { executeMoveParagraph } from '@/services/moveParagraphService';

export {
  executeInsertText,
  executeReplaceText,
  executeDeleteText,
  executeInsertParagraph,
  executeDeleteParagraph,
  executeMoveParagraph
};
