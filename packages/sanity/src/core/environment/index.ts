/** @internal */
// eslint-disable-next-line no-process-env
export const isDev = process.env.NODE_ENV !== 'production'

/** @internal */
export const isProd = !isDev

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
    .flatMap((entry) => {
      if (!entry.textContent) return []
      const entryImports = JSON.parse(entry.textContent)
      return Object.keys(entryImports.imports || {})
    })
    .some((key) => key === 'sanity')
}
