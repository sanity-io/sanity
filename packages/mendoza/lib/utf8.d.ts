export declare function utf8charSize(code: number): 1 | 2 | 3 | 4
export declare function utf8stringSize(str: string): number
/** Converts an UTF-8 byte index into a UCS-2 index. */
export declare function utf8resolveIndex(str: string, idx: number, start?: number): number
export declare function commonPrefix(str: string, str2: string): number
export declare function commonSuffix(str: string, str2: string, prefix?: number): number
