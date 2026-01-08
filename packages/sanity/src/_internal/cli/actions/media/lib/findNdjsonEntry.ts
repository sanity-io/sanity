import readline from 'node:readline'
import {Readable} from 'node:stream'

/**
 * Find the first matching entry in the provided NDJSON stream.
 *
 * @internal
 */
export async function* findNdjsonEntry<Type>(
  ndjson: Readable,
  matcher: (line: Type) => boolean,
): AsyncGenerator<Type | undefined> {
  const lines = readline.createInterface({
    input: ndjson,
  })

  try {
    for await (const line of lines) {
      const parsed = JSON.parse(line.trim())
      if (matcher(parsed)) {
        yield parsed
        return
      }
    }

    yield undefined
  } finally {
    lines.close()
    // Explicitly destroy the underlying stream to prevent file descriptor leaks
    ndjson.destroy()
  }
}

/**
 * Read and parse all entries from an NDJSON stream.
 *
 * @internal
 */
export async function readNdjsonFile<Type>(ndjson: Readable): Promise<Type[]> {
  const lines = readline.createInterface({
    input: ndjson,
  })

  const entries: Type[] = []

  try {
    for await (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) {
        entries.push(JSON.parse(trimmed))
      }
    }
  } finally {
    lines.close()
    // Explicitly destroy the underlying stream to prevent file descriptor leaks
    ndjson.destroy()
  }

  return entries
}
