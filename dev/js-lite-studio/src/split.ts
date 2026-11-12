/**
 * Splits a query response, `{"result": [<document>, …], "ms": …}`, into its documents as the
 * bytes arrive, so a page can be processed while it downloads and is never held or parsed whole:
 * the port of the Rust studio's `split.rs`. A document comes out as its JSON when it is no longer
 * than the limit, and always with the raw JSON of the top-level fields asked for.
 */

/** Fields larger than this are left out: they are only read for previews and sorting. */
const FIELD_LIMIT = 16 * 1024

const QUOTE = 0x22
const BACKSLASH = 0x5c
const RESULT = [...'result'].map((char) => char.charCodeAt(0))

export interface Split {
  /** The document's JSON, `undefined` when it is longer than the limit. */
  json: Uint8Array | undefined
  /** The length of the document's JSON, in bytes. */
  len: number
  /** The fields asked for that the document has, by index into them, as raw JSON. */
  fields: [number, Uint8Array][]
}

type Kind = 'container' | 'string' | 'scalar'

/** Bytes of a value being read: the document, or a field of it. */
class Value {
  readonly kind: Kind
  readonly limit: number
  parts: Uint8Array[] = []
  size = 0
  /** Where the value starts in the chunk being read, `undefined` once it went over its limit. */
  start: number | undefined
  len = 0

  constructor(kind: Kind, start: number, limit: number) {
    this.kind = kind
    this.start = start
    this.limit = limit
  }

  /** Takes the bytes of the value in `chunk` up to `end`. */
  take(chunk: Uint8Array, end: number): void {
    const from = this.start ?? 0
    this.len += end - from
    if (this.start === undefined) return
    if (this.size + end - from > this.limit) {
      this.start = undefined
      this.parts = []
      this.size = 0
    } else {
      this.parts.push(chunk.subarray(from, end))
      this.size += end - from
    }
  }

  bytes(): Uint8Array | undefined {
    if (this.start === undefined) return undefined
    if (this.parts.length === 1) return this.parts[0]
    const bytes = new Uint8Array(this.size)
    let offset = 0
    for (const part of this.parts) {
      bytes.set(part, offset)
      offset += part.length
    }
    return bytes
  }
}

interface Document {
  value: Value
  fields: [number, Uint8Array][]
  /** The field of the member being read, when it is one of those asked for. */
  member: number | undefined
  field: [number, Value] | undefined
  object: boolean
  expectKey: boolean
}

function isStructural(byte: number): boolean {
  // Whitespace, `,`, `:`, `{`, `}`, `[`, `]` and `"`.
  return (
    byte === 0x20 ||
    byte === 0x0a ||
    byte === 0x0d ||
    byte === 0x09 ||
    byte === 0x2c ||
    byte === 0x3a ||
    byte === 0x7b ||
    byte === 0x7d ||
    byte === 0x5b ||
    byte === 0x5d ||
    byte === QUOTE
  )
}

function sameBytes(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index])
}

export class Splitter {
  private readonly limit: number
  private readonly keys: number[][]
  private depth = 0
  private string = false
  private escape = false
  private scalar = false
  /** The bytes of the object key being read, at the response's or a document's top level. */
  private key: number[] | undefined
  private rootExpectKey = false
  private rootKey: number[] = []
  /** The value after the `result` key is next. */
  private resultNext = false
  private inResult = false
  private foundResult = false
  private document: Document | undefined
  private readonly done: Split[] = []
  private head = 0

  /**
   * Splits documents no longer than `limit` bytes off whole, and reads `fields` of all of them.
   * Keys are compared as they appear in the response, escapes included, which is exact for field
   * names, since those cannot contain a quote, a backslash or a control character.
   */
  constructor(limit: number, fields: string[]) {
    this.limit = limit
    const encoder = new TextEncoder()
    this.keys = fields.map((field) => [...encoder.encode(field)])
  }

  /** The next document split off, if any. */
  pop(): Split | undefined {
    if (this.head === this.done.length) return undefined
    const split = this.done[this.head]
    this.head++
    if (this.head === this.done.length) {
      this.done.length = 0
      this.head = 0
    }
    return split
  }

  /** Checks that the response was whole once it ended: the error, if not. */
  finish(): string | undefined {
    if (this.depth !== 0 || this.string || this.document) return 'The query response ended early'
    if (!this.foundResult) return 'The query result is not an array'
    return undefined
  }

  /** Reads the next bytes of the response. */
  push(chunk: Uint8Array): void {
    // The next quote and backslash at or after `i`, found once per stretch of the chunk.
    let quote = -1
    let backslash = -1
    let i = 0
    while (i < chunk.length) {
      if (this.string) {
        if (this.escape) {
          this.escape = false
          this.key?.push(chunk[i])
          i++
          continue
        }
        if (quote !== -2 && quote < i) quote = chunk.indexOf(QUOTE, i)
        if (backslash !== -2 && backslash < i) backslash = chunk.indexOf(BACKSLASH, i)
        // -2 marks a byte the rest of the chunk has none of.
        if (quote === -1) quote = -2
        if (backslash === -1) backslash = -2
        const end = Math.min(quote < 0 ? Infinity : quote, backslash < 0 ? Infinity : backslash)
        if (end === Infinity) {
          if (this.key) for (let at = i; at < chunk.length; at++) this.key.push(chunk[at])
          break
        }
        if (this.key) for (let at = i; at < end; at++) this.key.push(chunk[at])
        i = end
        if (chunk[i] === BACKSLASH) {
          this.escape = true
          this.key?.push(BACKSLASH)
        } else {
          this.string = false
          this.stringEnd(chunk, i)
        }
        i++
        continue
      }
      const byte = chunk[i]
      if (this.scalar) {
        if (!isStructural(byte)) {
          i++
          continue
        }
        this.scalar = false
        this.valueEnd(chunk, i, 'scalar')
      }
      switch (byte) {
        case 0x20:
        case 0x0a:
        case 0x0d:
        case 0x09:
          break
        case QUOTE:
          this.valueStart(i, 'string')
          this.string = true
          break
        case 0x7b:
        case 0x5b:
          this.valueStart(i, 'container')
          this.depth++
          this.open(byte)
          break
        case 0x7d:
        case 0x5d:
          this.depth = Math.max(this.depth - 1, 0)
          this.close(chunk, i)
          break
        case 0x2c:
          this.comma()
          break
        case 0x3a:
          if (this.depth === 1) this.resultNext = sameBytes(this.rootKey, RESULT)
          break
        default:
          this.valueStart(i, 'scalar')
          this.scalar = true
      }
      i++
    }
    // What the chunk holds of the values being read.
    const document = this.document
    if (document) {
      document.value.take(chunk, chunk.length)
      if (document.value.start !== undefined) document.value.start = 0
      const field = document.field?.[1]
      if (field) {
        field.take(chunk, chunk.length)
        if (field.start !== undefined) field.start = 0
      }
    }
  }

  private valueStart(at: number, kind: Kind): void {
    if (this.depth === 1 && this.rootExpectKey && kind === 'string') {
      this.rootExpectKey = false
      this.key = []
    } else if (this.depth === 1 && this.resultNext) {
      this.resultNext = false
      if (kind === 'container') {
        this.inResult = true
        this.foundResult = true
      }
    } else if (this.depth === 2 && this.inResult && !this.document) {
      this.document = {
        value: new Value(kind, at, this.limit),
        fields: [],
        member: undefined,
        field: undefined,
        object: false,
        expectKey: false,
      }
    } else if (this.depth === 3 && this.document) {
      const document = this.document
      if (document.expectKey && kind === 'string') {
        document.expectKey = false
        this.key = []
      } else if (document.member !== undefined) {
        document.field = [document.member, new Value(kind, at, FIELD_LIMIT)]
        document.member = undefined
      }
    }
  }

  private open(byte: number): void {
    if (this.depth === 1) this.rootExpectKey = byte === 0x7b
    else if (this.depth === 3 && this.document) {
      this.document.object = byte === 0x7b
      this.document.expectKey = this.document.object
    }
  }

  private stringEnd(chunk: Uint8Array, at: number): void {
    const key = this.key
    if (key) {
      this.key = undefined
      if (this.depth === 1) this.rootKey = key
      else if (this.depth === 3 && this.document) {
        const index = this.keys.findIndex((wanted) => sameBytes(wanted, key))
        this.document.member = index === -1 ? undefined : index
      }
      return
    }
    this.valueEnd(chunk, at + 1, 'string')
  }

  private close(chunk: Uint8Array, at: number): void {
    if (this.depth === 1 && this.inResult) {
      this.inResult = false
      return
    }
    this.valueEnd(chunk, at + 1, 'container')
  }

  /** Ends a field or a document of `kind` that ends before `end` at the current depth. */
  private valueEnd(chunk: Uint8Array, end: number, kind: Kind): void {
    const document = this.document
    if (!document) return
    if (this.depth === 2) {
      if (document.value.kind !== kind) return
      this.document = undefined
      document.value.take(chunk, end)
      this.done.push({
        json: document.value.bytes(),
        len: document.value.len,
        fields: document.fields,
      })
    } else if (this.depth === 3 && document.field) {
      const [index, field] = document.field
      if (field.kind !== kind) return
      document.field = undefined
      field.take(chunk, end)
      const bytes = field.bytes()
      if (bytes) document.fields.push([index, bytes])
    }
  }

  private comma(): void {
    if (this.depth === 1) this.rootExpectKey = true
    else if (this.depth === 3 && this.document) {
      this.document.expectKey = this.document.object
      this.document.member = undefined
    }
  }
}
