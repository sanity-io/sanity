/**
 * Lazy wrapper around the WebAssembly build of the `groq-format` formatter and the `groq-lint`
 * rules. The runtime comes from the `@sanity-labs/groq-wasm/lazy` entry, which has no top-level
 * await and fetches its bytes only in `load()`, so the module loads on the first format or lint,
 * not with the tool. Do not import the package entry: its browser build fetches the bytes while
 * the module evaluates, and some bundlers then fail to parse it.
 * Parse errors carry UTF-8 byte offsets from Rust; everything returned from here is an index into
 * the query string, as the editor understands it.
 */

interface GroqWasmModule {
  DEFAULT_WIDTH: number
  format: (query: string, config?: {width?: number}) => string
  lint: (query: string) => WasmFinding[]
  extractParams: (
    query: string,
  ) => Array<{name: string; references: Array<{start: number; end: number}>}>
}

export type GroqFindingSeverity = 'error' | 'warning' | 'info'

export interface GroqFinding {
  /** The rule that fired, kebab-cased (`join-in-filter`) */
  ruleId: string
  message: string
  severity: GroqFindingSeverity
  from: number
  to: number
}

/** The runtime shape of a finding from `@sanity-labs/groq-wasm`'s `lint` */
export interface WasmFinding {
  ruleId: string
  message: string
  severity: GroqFindingSeverity
  /** Indices into the query string; absent for findings about the query as a whole */
  span?: {start: {offset: number}; end: {offset: number}}
}

/** The query does not parse; `from` and `to` delimit the offending token */
export class GroqSyntaxError extends Error {
  override name = 'GroqSyntaxError'
  readonly from: number
  readonly to: number

  constructor(message: string, from: number, to: number) {
    super(message)
    this.from = from
    this.to = to
  }
}

/** A `$name` reference extracted from a query, with its locations */
export interface GroqQueryParam {
  name: string
  /** Where `$name` occurs in the query; already indices into the query string */
  references: Array<{from: number; to: number}>
}

let groqWasm: Promise<GroqWasmModule> | undefined

function loadGroqWasm(): Promise<GroqWasmModule> {
  groqWasm ??= import('@sanity-labs/groq-wasm/lazy')
    .then(async (api) => {
      await api.load()
      return api
    })
    .catch((error: unknown) => {
      // The fetch or the WebAssembly compile failed: forget the attempt so the next format or
      // lint tries again
      groqWasm = undefined
      throw error
    })
  return groqWasm
}

function isAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return false
  }
  return true
}

/**
 * Maps UTF-8 byte offsets to indices into `text`. Rust counts bytes, JavaScript strings count
 * UTF-16 code units; the two only agree while the text is ASCII.
 */
export function createByteOffsetConverter(text: string): (byteOffset: number) => number {
  if (isAscii(text)) {
    return (byteOffset) => Math.max(0, Math.min(byteOffset, text.length))
  }
  return (byteOffset) => {
    let bytes = 0
    let index = 0
    for (const char of text) {
      if (bytes >= byteOffset) break
      const codePoint = char.codePointAt(0) || 0
      bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4
      index += char.length
    }
    return index
  }
}

// `Format error: Parse("expected ']' at Position { start: 1, end: 14 }")`,
// `Lint error: expected ']' at Position { start: 1, end: 14 }` and
// `Failed to parse query: Parse error: expected ']' at Position { start: 1, end: 14 }` (from
// `extractParams`) are the shapes the wasm wrapper produces; the message inside `Parse("…")` is
// Rust debug-escaped
const PARSE_WRAPPER_RE = /Parse\("((?:[^"\\]|\\.)*)"\)/
const PREFIX_RE =
  /^(?:(?:Failed to parse query|Format failed|Lint failed|Format error|Lint error|Parse error): )+/
const POSITION_RE = /\s*at Position \{ start: (\d+), end: (\d+) \}\s*$/

/** Turns the wasm wrapper's parse failures into a {@link GroqSyntaxError}; anything else is rethrown */
function toSyntaxError(error: unknown, query: string): GroqSyntaxError {
  if (!(error instanceof Error)) {
    throw error
  }
  const wrapped = PARSE_WRAPPER_RE.exec(error.message)
  const message = (wrapped ? wrapped[1].replace(/\\(.)/g, '$1') : error.message).replace(
    PREFIX_RE,
    '',
  )
  const position = POSITION_RE.exec(message)
  if (!position) {
    throw error
  }
  const toIndex = createByteOffsetConverter(query)
  const from = toIndex(Number(position[1]))
  const to = Math.max(from, toIndex(Number(position[2])))
  return new GroqSyntaxError(message.slice(0, position.index).trim(), from, to)
}

/**
 * Formats a query with `groq-format`, wrapping at `width` columns. Comments and parameter
 * references are preserved. Rejects with a {@link GroqSyntaxError} when the query does not parse.
 */
export async function formatGroq(query: string, width?: number): Promise<string> {
  const wasm = await loadGroqWasm()
  try {
    return wasm.format(query, {width: width ?? wasm.DEFAULT_WIDTH})
  } catch (error) {
    throw toSyntaxError(error, query)
  }
}

/**
 * Runs the `groq-lint` rules (joins in filters, unindexable comparisons, deep pagination, ...)
 * over a query. Rejects with a {@link GroqSyntaxError} when the query does not parse.
 */
export async function lintGroq(query: string): Promise<GroqFinding[]> {
  const wasm = await loadGroqWasm()
  let findings: WasmFinding[]
  try {
    findings = wasm.lint(query)
  } catch (error) {
    throw toSyntaxError(error, query)
  }
  return toGroqFindings(findings, query)
}

/** Converts the wasm findings' spans into ranges of `query`; a finding without a span covers all of it */
export function toGroqFindings(findings: WasmFinding[], query: string): GroqFinding[] {
  const clamp = (index: number) => Math.max(0, Math.min(index, query.length))
  return findings.map(({ruleId, message, severity, span}) => {
    const from = span ? clamp(span.start.offset) : 0
    const to = span ? Math.max(from, clamp(span.end.offset)) : query.length
    return {ruleId, message: message.trim(), severity, from, to}
  })
}

/**
 * Extracts every `$name` parameter a query references, with their locations. `extractParams`
 * already returns indices into the query string, so no conversion happens here. Rejects with a
 * {@link GroqSyntaxError} when the query does not parse.
 */
export async function extractQueryParams(query: string): Promise<GroqQueryParam[]> {
  const wasm = await loadGroqWasm()
  try {
    return wasm.extractParams(query).map(({name, references}) => ({
      name,
      references: references.map(({start, end}) => ({from: start, to: end})),
    }))
  } catch (error) {
    throw toSyntaxError(error, query)
  }
}
