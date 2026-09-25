import type * as GroqWasm from '@sanity-labs/groq-wasm'

/**
 * Lazy wrapper around `@sanity-labs/groq-wasm`: the WebAssembly build of the `groq-format`
 * formatter and the `groq-lint` rules from sanity-labs/sanity-lint. Evaluating that module fetches
 * and instantiates some 340 KB of WebAssembly, so it is only loaded when a query is first
 * formatted or linted, not with the tool. Rust reports UTF-8 byte offsets; everything returned
 * from here is converted to indices into the query string, as the editor understands them.
 */

type GroqWasmModule = typeof GroqWasm

export type GroqFindingSeverity = 'error' | 'warning' | 'info'

export interface GroqFinding {
  /** The rule that fired, kebab-cased (`join-in-filter`) */
  ruleId: string
  message: string
  severity: GroqFindingSeverity
  from: number
  to: number
}

/** The runtime shape of a `@sanity-labs/groq-wasm` finding; its declared type is not shipped */
export interface WasmFinding {
  ruleId: string
  message: string
  severity: GroqFindingSeverity
  /** UTF-8 byte offsets into the query; absent for findings about the query as a whole */
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

let groqWasm: Promise<GroqWasmModule> | undefined

function loadGroqWasm(): Promise<GroqWasmModule> {
  groqWasm ??= import('@sanity-labs/groq-wasm').catch((error: unknown) => {
    // Offline or blocked WebAssembly: forget the failed attempt so the next call retries
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

// `Format error: Parse("expected ']' at Position { start: 1, end: 14 }")` and
// `Lint error: expected ']' at Position { start: 1, end: 14 }` are the two shapes the wasm
// wrapper produces; the message inside `Parse("…")` is Rust debug-escaped
const PARSE_WRAPPER_RE = /Parse\("((?:[^"\\]|\\.)*)"\)/
const PREFIX_RE =
  /^(?:(?:Failed to parse query|Format failed|Lint failed|Format error|Lint error): )+/
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

/** Converts the wasm findings' byte spans into ranges of `query`; a finding without a span covers all of it */
export function toGroqFindings(findings: WasmFinding[], query: string): GroqFinding[] {
  const toIndex = createByteOffsetConverter(query)
  return findings.map(({ruleId, message, severity, span}) => {
    const from = span ? toIndex(span.start.offset) : 0
    const to = span ? Math.max(from, toIndex(span.end.offset)) : query.length
    return {ruleId, message: message.trim(), severity, from, to}
  })
}
