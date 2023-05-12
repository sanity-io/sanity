import {extractAccessors} from './extractAccessors'

/**
 * Extracts values matching the given JsonPath
 *
 * @param path - Path to extract
 * @param value - Value to extract from
 * @returns An array of objects from the given path
 * @internal
 */
export function extract(path: string, value: unknown): unknown[] {
  const accessors = extractAccessors(path, value)
  return accessors.map((acc) => acc.get())
}
