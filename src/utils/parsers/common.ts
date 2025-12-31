import type { 
  ParagraphOptions, 
  BlockType, 
  TextAlign, 
  ParagraphSpacing, 
  IndentLevel 
} from '@/types/command';

/**
 * コマンド文字列から引数を抽出
 */
export function extractArguments(commandStr: string): string[] {
  const startIndex = commandStr.indexOf('(');
  const endIndex = commandStr.lastIndexOf(')');
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return [];
  }

  const argsStr = commandStr.substring(startIndex + 1, endIndex);
  const args = argsStr.split(',').map(arg => arg.trim());
  
  return args;
}

/**
 * オプション文字列をパース
 */
export function parseOptions(optionsStr: string): ParagraphOptions {
  const options: ParagraphOptions = {};

  if (!optionsStr || optionsStr.trim() === '') {
    return options;
  }

  const pairs = optionsStr.split(',').map(p => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim());

    if (!key || !value) continue;

    switch (key) {
      case 'blockType':
        if (['p', 'h1', 'h2', 'h3'].includes(value)) {
          options.blockType = value as BlockType;
        }
        break;
      case 'textAlign':
        if (['left', 'center', 'right'].includes(value)) {
          options.textAlign = value as TextAlign;
        }
        break;
      case 'spacing':
        if (['none', 'xs', 'm', 'l', 'xl'].includes(value)) {
          options.spacing = value as ParagraphSpacing;
        }
        break;
      case 'indent':
        const indentNum = parseInt(value, 10);
        if (indentNum >= 0 && indentNum <= 4) {
          options.indent = indentNum as IndentLevel;
        }
        break;
    }
  }

  return options;
}
