import {extractAccessors} from './extractAccessors'

/**
 * Extracts a value for the given JsonPath, and includes the specific path of where it was found
 *
 * @param path - Path to extract
 * @param value - Value to extract from
 * @returns An array of objects with `path` and `value` keys
 * @internal
 */
export function extractWithPath(
  path: string,
  value: unknown
): {path: (string | number)[]; value: unknown}[] {
  const accessors = extractAccessors(path, value)
  return accessors.map((acc) => ({path: acc.path, value: acc.get()}))
}
