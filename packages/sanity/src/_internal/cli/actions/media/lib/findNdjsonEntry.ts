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

  for await (const line of lines) {
    const parsed = JSON.parse(line.trim())
    if (matcher(parsed)) {
      yield parsed
      lines.close()
      return
    }
  }

  yield undefined
}
