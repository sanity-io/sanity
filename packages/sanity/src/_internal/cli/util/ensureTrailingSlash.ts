/**
 * Ensures that the given path ends with a `/`, and does not add an
 * additional one if it already does
 *
 * @param path - The path to ensure has a trailing slash
 * @returns A path with a trailing slash
 * @internal
 */
export function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}
