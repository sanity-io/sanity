const encoder = new TextEncoder()
const decoder = new TextDecoder()
const TEXT = encoder.encode(
  `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. `,
)

/**
 * Generate a Uint8Array of lorem ipsum text of the given byte size
 * @param byteSize - The size in bytes of the uint array to generate
 * @internal
 */
export function loremBytes(byteSize: number): Uint8Array {
  const result = new Uint8Array(byteSize)
  for (let i = 0; i < byteSize; i++) {
    result[i] = TEXT[i % TEXT.byteLength]
  }
  return result
}

/**
 * Generate a lorem ipsum string of the given byte size
 * @param byteSize - The size in bytes of the string to generate
 */
export function loremString(byteSize: number): string {
  return decoder.decode(loremBytes(byteSize))
}
