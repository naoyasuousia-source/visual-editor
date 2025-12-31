/**
 * Reads text from a File object.
 */
export function readTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error("Empty file"));
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * 解析結果の型定義
 */
export interface ParseResult {
    isWordModeDetected: boolean;
    pageMargin?: 's' | 'm' | 'l';
}
