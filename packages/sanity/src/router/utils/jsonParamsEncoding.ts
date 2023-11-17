import {decodeBase64Url, encodeBase64Url} from './base64url'

/**
 * Decode a path segment containing JSON parameters
 *
 * @param pathSegment - The path segment to decode
 * @returns The decoded parameters
 * @internal
 * @hidden
 */
export function decodeJsonParams(pathSegment = ''): Record<string, unknown> {
  const segment = decodeURIComponent(pathSegment)

  if (!segment) {
    return {}
  }

  // Because of high-unicode characters (eg outside of the latin1 range), we prefer base64url
  // since it also removes characters we'd rather not put in our URLs (eg '=' and '/')
  try {
    return JSON.parse(decodeBase64Url(segment))
  } catch (err) {
    // Fall-through: previously we used plain base64 encoding instead of base64url
  }

  try {
    return JSON.parse(atob(segment))
  } catch (err) {
    // Fall-through: before _that_, we used plain URI encoding
  }

  try {
    return JSON.parse(segment)
  } catch (err) {
    console.warn('Failed to parse JSON parameters')
  }

  return {}
}

/**
 * Encodes a set of parameters as a path segment, using base64url
 *
 * @param params - Paramters to encode
 * @returns The encoded parameters as a path segment
 * @internal
 * @hidden
 */
export function encodeJsonParams(params?: Record<string, unknown>): string {
  return params ? encodeBase64Url(JSON.stringify(params)) : ''
}
