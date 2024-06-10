/**
 * Returns whether or not there is a `sanity` entry in an import map in the current document,
 * which usually means that this studio is "auto updating".
 * @internal
 */
export const hasSanityPackageInImportMap = () => {
  if (typeof document === 'undefined' || !('querySelectorAll' in document)) {
    return false
  }
  const importMapEntries = document.querySelectorAll('script[type="importmap"]')
  return Array.from(importMapEntries).some((entry) => {
    if (!entry.textContent) return false
    const importMap = JSON.parse(entry.textContent)
    const imports = importMap.imports || {}
    return 'sanity' in imports
  })
}
