import {extractAccessors} from './extractAccessors'

/**
 * Extracts values matching the given JsonPath
 *
 * @param path - Path to extract
 * @param value - Value to extract from
 * @returns An array of values matching the given path
 * @public
 */
export function extract(path: string, value: unknown): unknown[] {
  const accessors = extractAccessors(path, value)
  return accessors.map((acc) => acc.get())
}
