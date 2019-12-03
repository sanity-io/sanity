type KeyedSegment = {_key: string}
type PathSegment = string | number | KeyedSegment
type Path = PathSegment[]

export declare const FOCUS_TERMINATOR: string
export declare function get(obj: any, path: Path | string, defaultVal?: any): any
export declare function isEqual(path: Path, otherPath: Path): boolean
export declare function isSegmentEqual(
  pathSegment: PathSegment,
  otherPathSegment: PathSegment
): boolean
export declare function hasFocus(focusPath: Path, path: Path): boolean
export declare function hasItemFocus(focusPath: Path, item: Path): boolean
export declare function isExpanded(segment: PathSegment, focusPath: Path): boolean
export declare function startsWith(prefix: Path, path: Path): boolean
export declare function trimLeft(prefix: Path, path: Path): Path
export declare function trimRight(suffix: Path, path: Path): Path
export declare function toString(path: Path): string
export declare function fromString(path: string): Path
export declare function randomKey(length?: number): string
export declare function toString(path: Path): string
export {}
