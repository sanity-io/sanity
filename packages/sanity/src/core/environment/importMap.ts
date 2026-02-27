/**
 * Returns whether or not there is a `sanity` entry in an import map in the current document,
 * which usually means that this studio is "auto updating".
 * @internal
 */
export const hasSanityPackageInImportMap = () => {
  return Boolean(getSanityImportMapUrl())
}

/**
 * Returns the url of the first `sanity` entry found in an import map in the current document
 * @internal
 */
export const getSanityImportMapUrl = () => {
  if (typeof document === 'undefined' || !('querySelectorAll' in document)) {
    return undefined
  }
  const importMapEntries = document.querySelectorAll('script[type="importmap"]')
  let found: string | undefined
  Array.from(importMapEntries).some((entry) => {
    if (!entry.textContent) return false
    const importMap = JSON.parse(entry.textContent)
    const imports = importMap.imports || {}
    if ('sanity' in imports) {
      found = imports.sanity
      return true
    }
    return false
  })
  return found
}
