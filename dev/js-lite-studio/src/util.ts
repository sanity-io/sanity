/**
 * Small browser helpers: storage, ids, time, text. The same helpers as the Rust studio's
 * `util.rs`, so both studios show the same labels.
 */

export type Json = null | boolean | number | string | Json[] | {[key: string]: Json}
export type JsonObject = {[key: string]: Json}

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Throws in private browsing or when the quota is exceeded
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // See `storageSet`
  }
}

const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function randomKey(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let key = ''
  for (const byte of bytes) key += KEY_ALPHABET[byte % KEY_ALPHABET.length]
  return key
}

export function uuid(): string {
  return crypto.randomUUID()
}

export function draftId(id: string): string {
  return `drafts.${publishedId(id)}`
}

export function publishedId(id: string): string {
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length)
  if (id.startsWith('versions.')) {
    const rest = id.slice('versions.'.length)
    const dot = rest.indexOf('.')
    return dot === -1 ? id : rest.slice(dot + 1)
  }
  return id
}

export function versionId(release: string, id: string): string {
  return `versions.${release}.${publishedId(id)}`
}

/** The release a version id belongs to: `r1` for `versions.r1.abc`. */
export function releaseOf(id: string): string | undefined {
  if (!id.startsWith('versions.')) return undefined
  const rest = id.slice('versions.'.length)
  const dot = rest.indexOf('.')
  return dot === -1 ? undefined : rest.slice(0, dot)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** "just now", "5 min ago", "3 days ago", … for an ISO timestamp. */
export function timeAgo(iso: string | undefined): string {
  const then = iso ? Date.parse(iso) : Number.NaN
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, (Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  const [value, unit] =
    seconds < 3600
      ? [seconds / 60, 'min']
      : seconds < 86_400
        ? [seconds / 3600, 'hr']
        : seconds < 2_592_000
          ? [seconds / 86_400, 'day']
          : seconds < 31_536_000
            ? [seconds / 2_592_000, 'month']
            : [seconds / 31_536_000, 'year']
  const count = Math.floor(value)
  const plural = count === 1 || unit === 'min' || unit === 'hr' ? '' : 's'
  return `${count} ${unit}${plural} ago`
}

const isLower = (c: string) => c !== c.toUpperCase() && c === c.toLowerCase()
const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase()
const isDigit = (c: string) => c >= '0' && c <= '9'
const isAlpha = (c: string) => isLower(c) || isUpper(c)
const isAlphanumeric = (c: string) => isAlpha(c) || isDigit(c) || /\p{L}|\p{N}/u.test(c)

/** lodash's `startCase`: `publishedAt` → `Published At`. */
export function startCase(name: string): string {
  const chars = [...name]
  const words: string[] = []
  let word = ''
  chars.forEach((c, index) => {
    if (!isAlphanumeric(c)) {
      if (word) words.push(word)
      word = ''
      return
    }
    const previous = chars[index - 1]
    const next = chars[index + 1]
    const boundary =
      index > 0 &&
      word !== '' &&
      ((isLower(previous) && isUpper(c)) ||
        (isAlpha(previous) && isDigit(c)) ||
        (isDigit(previous) && isAlpha(c)) ||
        (isUpper(previous) && isUpper(c) && next !== undefined && isLower(next)))
    if (boundary) {
      words.push(word)
      word = ''
    }
    word += c
  })
  if (word) words.push(word)
  return words.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

/** The text a preview shows for a field value. */
export function previewText(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value.trim() ? value : undefined
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    // Portable Text, or an internationalized array of `{value}` entries
    const text = value
      .map((item) => {
        if (isObject(item) && Array.isArray(item.children)) {
          return item.children
            .map((span) => (isObject(span) && typeof span.text === 'string' ? span.text : ''))
            .join('')
        }
        return (isObject(item) ? previewText(item.value) : undefined) ?? previewText(item)
      })
      .filter((part): part is string => Boolean(part))
    return text.length > 0 ? text.join(' ') : undefined
  }
  if (isObject(value)) {
    const candidate =
      value.current ??
      value.title ??
      value.name ??
      Object.values(value).find((entry) => typeof entry === 'string')
    return previewText(candidate)
  }
  return undefined
}

function searchTokens(query: string): string[] {
  const tokens: string[] = []
  let token = ''
  let quoted = false
  for (const char of query) {
    if (char === '"') quoted = !quoted
    if (/\s/.test(char) && !quoted) {
      if (token) tokens.push(token)
      token = ''
    } else {
      token += char
    }
  }
  if (token) tokens.push(token)
  return tokens
}

/**
 * A search query for GROQ's `match`, with a wildcard after the last plain word so it also
 * matches while that word is being typed, like the JS studio's search.
 */
export function prefixLast(query: string): string {
  const tokens = searchTokens(query)
  if (tokens.length === 0) return '*'
  const isPlain = (token: string) =>
    !token.startsWith('-') && !(token.startsWith('"') && token.endsWith('"'))
  for (let index = tokens.length - 1; index >= 0; index--) {
    if (isPlain(tokens[index])) {
      if (!tokens[index].endsWith('*')) tokens[index] += '*'
      break
    }
  }
  return tokens.join(' ')
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Removes the system fields a new draft or version of `doc` must not carry. */
export function stripSystemFields(doc: JsonObject, targetId: string): JsonObject {
  const {_rev, _createdAt, _updatedAt, _id, ...rest} = doc
  void _rev
  void _createdAt
  void _updatedAt
  void _id
  return targetId ? {...rest, _id: targetId} : rest
}
