/*
 * The presence of the sanity module in the importmap script
 * indicates that the studio was probably built with an auto-updates flag.
 */

/** @internal */
export const hasSanityPackageInImportMap = () => {
  if (typeof document === 'undefined' || !('querySelectorAll' in document)) {
    return false
  }
  const importMapEntries = document.querySelectorAll('script[type="importmap"]')
  return Array.from(importMapEntries)
    .some((entry) => {
      if (!entry.textContent) return false
      const importMap = JSON.parse(entry.textContent)
      const imports = importMap.imports || {}
      return 'sanity' in imports
    })
}
