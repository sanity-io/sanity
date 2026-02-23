/**
 * Ensures that the given path both starts and ends with a single slash
 *
 * @internal
 */
export function normalizeBasePath(pathName: string): string {
  return `/${pathName}/`.replace(/^\/+/, '/').replace(/\/+$/, '/')
}
