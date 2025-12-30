/**
 * 段落ID管理ユーティリティ
 * 段落IDの生成、検証、変換を行う
 */

import type { ParagraphId } from '@/types/command';
import { v4 as uuidv4 } from 'uuid';

/**
 * 正式な段落IDを生成
 * 形式: p{ページ番号}-{段落番号}
 * 
 * @param pageNumber - ページ番号
 * @param paragraphNumber - 段落番号
 * @returns 段落ID
 */
export function generateParagraphId(
  pageNumber: number,
  paragraphNumber: number
): ParagraphId {
  return `p${pageNumber}-${paragraphNumber}`;
}

/**
 * 仮IDを生成
 * 形式: temp-{uuid}
 * 
 * @returns 仮ID
 */
export function generateTempId(): ParagraphId {
  return `temp-${uuidv4()}`;
}

/**
 * 段落IDが正式IDかどうかを判定
 * 
 * @param id - 段落ID
 * @returns 正式IDの場合true
 */
export function isOfficialId(id: ParagraphId): boolean {
  // Paginated形式: p1-1, p2-3 など
  // Word形式: p1, p2 など
  return /^p\d+(-\d+)?$/.test(id);
}

/**
 * 段落IDが仮IDかどうかを判定
 * 
 * @param id - 段落ID
 * @returns 仮IDの場合true
 */
export function isTempId(id: ParagraphId): boolean {
  return /^temp-[a-f0-9-]+$/.test(id);
}

/**
 * 段落IDが有効かどうかを判定
 * 
 * @param id - 段落ID
 * @returns 有効な場合true
 */
export function isValidParagraphId(id: ParagraphId): boolean {
  return isOfficialId(id) || isTempId(id);
}

/**
 * 正式IDからページ番号を抽出
 * 
 * @param id - 正式段落ID
 * @returns ページ番号、抽出失敗時または単一番号形式(Wordモード)時はnull
 */
export function extractPageNumber(id: ParagraphId): number | null {
  if (!isOfficialId(id)) {
    return null;
  }
  // p{page}-{para} 形式から抽出
  const match = id.match(/^p(\d+)-\d+$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 正式IDから段落番号を抽出
 * 
 * @param id - 正式段落ID
 * @returns 段落番号、抽出失敗時はnull
 */
export function extractParagraphNumber(id: ParagraphId): number | null {
  if (!isOfficialId(id)) {
    return null;
  }
  // p{page}-{para} 形式から抽出
  const multiMatch = id.match(/^p\d+-(\d+)$/);
  if (multiMatch) {
    return parseInt(multiMatch[1], 10);
  }
  // p{number} 形式から抽出
  const singleMatch = id.match(/^p(\d+)$/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }
  return null;
}

/**
 * 仮IDを正式IDに昇格
 * 
 * @param tempId - 仮ID
 * @param pageNumber - ページ番号
 * @param paragraphNumber - 段落番号
 * @returns 正式ID
 */
export function promoteTempId(
  tempId: ParagraphId,
  pageNumber: number,
  paragraphNumber: number
): ParagraphId {
  if (!isTempId(tempId)) {
    throw new Error(`無効な仮ID: ${tempId}`);
  }
  return generateParagraphId(pageNumber, paragraphNumber);
}

/**
 * 段落ID配列をページ番号でソート
 * 
 * @param ids - 段落ID配列
 * @returns ソートされた段落ID配列
 */
export function sortParagraphIds(ids: ParagraphId[]): ParagraphId[] {
  return [...ids].sort((a, b) => {
    const pageA = extractPageNumber(a);
    const pageB = extractPageNumber(b);
    const paraA = extractParagraphNumber(a);
    const paraB = extractParagraphNumber(b);

    // 仮IDは最後に配置
    if (isTempId(a) && !isTempId(b)) return 1;
    if (!isTempId(a) && isTempId(b)) return -1;
    if (isTempId(a) && isTempId(b)) return 0;

    // ページ番号で比較
    if (pageA !== null && pageB !== null && pageA !== pageB) {
      return pageA - pageB;
    }

    // 段落番号で比較
    if (paraA !== null && paraB !== null) {
      return paraA - paraB;
    }

    return 0;
  });
}

/**
 * 段落ID配列から仮IDのみをフィルタリング
 * 
 * @param ids - 段落ID配列
 * @returns 仮IDの配列
 */
export function filterTempIds(ids: ParagraphId[]): ParagraphId[] {
  return ids.filter(isTempId);
}

/**
 * 段落ID配列から正式IDのみをフィルタリング
 * 
 * @param ids - 段落ID配列
 * @returns 正式IDの配列
 */
export function filterOfficialIds(ids: ParagraphId[]): ParagraphId[] {
  return ids.filter(isOfficialId);
}
