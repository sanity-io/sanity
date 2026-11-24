export interface TextChange {
  from: number
  to: number
  insert: string
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r'
}

/**
 * The edits that turn `from` into `to`, positions in `from`. When the two differ only in their
 * whitespace (the GROQ formatter changes nothing else), each differing run of whitespace is its
 * own edit, so a selection or an undo history mapped through them stays on the same tokens.
 * Otherwise the text between their common start and end is replaced in one edit.
 */
export function whitespaceChanges(from: string, to: string): TextChange[] {
  const changes: TextChange[] = []
  let i = 0
  let j = 0
  while (i < from.length || j < to.length) {
    const runStart = i
    while (i < from.length && isWhitespace(from[i])) i++
    const insertStart = j
    while (j < to.length && isWhitespace(to[j])) j++
    const insert = to.slice(insertStart, j)
    if (from.slice(runStart, i) !== insert) changes.push({from: runStart, to: i, insert})
    if (i === from.length && j === to.length) return changes
    if (i === from.length || j === to.length || from[i] !== to[j]) return replaceMiddle(from, to)
    i++
    j++
  }
  return changes
}

function replaceMiddle(from: string, to: string): TextChange[] {
  const maxPrefix = Math.min(from.length, to.length)
  let prefix = 0
  while (prefix < maxPrefix && from[prefix] === to[prefix]) prefix++
  let suffix = 0
  while (
    suffix < maxPrefix - prefix &&
    from[from.length - 1 - suffix] === to[to.length - 1 - suffix]
  ) {
    suffix++
  }
  return [{from: prefix, to: from.length - suffix, insert: to.slice(prefix, to.length - suffix)}]
}
