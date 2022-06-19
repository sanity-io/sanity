import getRandomValues from 'get-random-values-esm'

// WHATWG crypto RNG - https://w3c.github.io/webcrypto/Overview.html
function whatwgRNG(length = 16) {
  const rnds8 = new Uint8Array(length)
  getRandomValues(rnds8)
  return rnds8
}

const byteToHex: string[] = []
for (let i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substring(1)
}

/**
 * Generate a random key of the given length
 *
 * @param length - Length of string to generate
 * @returns A string of the given length
 * @public
 */
export function randomKey(length: number): string {
  return whatwgRNG(length)
    .reduce((str, n) => str + byteToHex[n], '')
    .slice(0, length)
}
