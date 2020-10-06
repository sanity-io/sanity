export function utf8charSize(code: number): 1 | 2 | 3 | 4 {
  if (code >> 16) {
    return 4
  } else if (code >> 11) {
    return 3
  } else if (code >> 7) {
    return 2
  } else {
    return 1
  }
}

export function utf8stringSize(str: string): number {
  let b = 0
  for (let i = 0; i < str.length; i++) {
    let code = str.codePointAt(i)!
    let size = utf8charSize(code)
    if (size == 4) i++
    b += size
  }
  return b
}

/** Converts an UTF-8 byte index into a UCS-2 index. */
export function utf8resolveIndex(str: string, idx: number, start = 0) {
  let byteCount = start
  let ucsIdx = 0

  for (ucsIdx = start; byteCount < idx; ucsIdx++) {
    let code = str.codePointAt(ucsIdx)!
    let size = utf8charSize(code)
    if (size === 4) ucsIdx++ // Surrogate pair.
    byteCount += size
  }

  return ucsIdx
}

export function commonPrefix(str: string, str2: string) {
  let len = Math.min(str.length, str2.length)
  let b = 0
  for (let i = 0; i < len; ) {
    let aPoint = str.codePointAt(i)!
    let bPoint = str2.codePointAt(i)!
    if (aPoint !== bPoint) return b
    let size = utf8charSize(aPoint)
    b += size
    i += size === 4 ? 2 : 1
  }
  return b
}

export function commonSuffix(str: string, str2: string, prefix: number = 0) {
  let len = Math.min(str.length, str2.length) - prefix
  let b = 0
  for (let i = 0; i < len; ) {
    let aPoint = str.codePointAt(str.length - 1 - i)!
    let bPoint = str2.codePointAt(str2.length - 1 - i)!
    if (aPoint !== bPoint) return b
    let size = utf8charSize(aPoint)
    b += size
    i += size === 4 ? 2 : 1
  }
  return b
}
