import stringify from 'json-stable-stringify'

let textEncoder: TextEncoder | undefined

/**
 * Produce a stable hash of any data that can be represented in JSON.
 */
export function hashData(data: unknown): Promise<string> {
  textEncoder ??= new TextEncoder()

  if (typeof data === 'string') {
    return hash(textEncoder.encode(data))
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return hash(textEncoder.encode(String(data)))
  }

  return hash(textEncoder.encode(stringify(data)))
}

async function hash(data: Uint8Array<ArrayBuffer>) {
  const digest = await globalThis.crypto.subtle.digest('SHA-1', data)
  return hex(new Uint8Array(digest))
}

async function hex(data: Uint8Array) {
  return Array.from(data)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')
}
