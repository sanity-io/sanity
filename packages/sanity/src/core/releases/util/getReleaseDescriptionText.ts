import {toPlainText} from '@portabletext/toolkit'

/**
 * Release descriptions are stored as untyped JSON. Studio writes a string, and other clients
 * have written Portable Text. Rendering that value as a React child throws
 * "Objects are not valid as a React child".
 *
 * Strings pass through unchanged. `toPlainText` reads the span text of a block or an array of
 * blocks and skips anything that is not a block, leaving inline objects such as a release
 * reference out. It throws when it reads a null node, and that becomes an empty string, so a
 * bad value still cannot crash the page.
 *
 * @internal
 */
export function getReleaseDescriptionText(description: unknown): string {
  // A string is not a block. toPlainText would return "" for it.
  if (typeof description === 'string') return description

  try {
    return toPlainText(description as Parameters<typeof toPlainText>[0]).trim()
  } catch {
    return ''
  }
}
