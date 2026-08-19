import {useSource} from '../../studio/source'

/**
 * Construct a pipe delimited title containing `activeTitle` (if applicable) and the base title
 * of the current source (which the structure tool also uses as its base title).
 *
 * @param activeTitle - Title of the first segment
 *
 * @returns A pipe delimited title in the format `${activeTitle} | %BASE_TITLE%`
 * or simply `%BASE_TITLE%` if `activeTitle` is undefined.
 *
 * @internal
 */
export function useConstructDocumentTitle(activeTitle?: string): string {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const baseTitle = useSource().title
  return [activeTitle, baseTitle].filter((title) => title).join(' | ')
}
