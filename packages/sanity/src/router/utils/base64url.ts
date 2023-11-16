/**
 * `atob()` and `btoa()` do not support Unicode characters outside of the Latin1 range,
 * but we obviously want to support the full range of Unicode characters in our router.
 *
 * Additionally, we would prefer not to use characters like `+` and `=` in URLs, as they
 * have specific meanings there and may be misinterpreted. Thus, this uses base64url instead
 * of the more common base64.
 */

/**
 * Encodes a string as base64url
 *
 * @param str - String to encode
 * @returns Encoded string
 * @internal
 */
export function encodeBase64Url(str: string): string {
  return encodeBase64(str).replace(/\//g, '_').replace(/\+/g, '-').replace(/[=]+$/, '')
}

/**
 * Decodes a base64url-encoded string
 *
 * @param str - String to decode
 * @returns Decoded string
 * @internal
 */
export function decodeBase64Url(str: string): string {
  return decodeBase64(str.replace(/-/g, '+').replace(/_/g, '/'))
}

function percentToByte(p: string) {
  return String.fromCharCode(parseInt(p.slice(1), 16))
}

function encodeBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%[0-9A-F]{2}/g, percentToByte))
}

function byteToPercent(b: string) {
  return `%${`00${b.charCodeAt(0).toString(16)}`.slice(-2)}`
}

function decodeBase64(str: string): string {
  return decodeURIComponent(Array.from(atob(str), byteToPercent).join(''))
}
