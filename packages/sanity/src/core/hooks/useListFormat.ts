import {intlCache} from '../i18n/intlCache'
import {useCurrentLocale} from '../i18n/hooks/useLocale'

/**
 * Options for the `useListFormat` hook
 *
 * @public
 */
export interface UseListFormatOptions {
  /**
   * The format of output message.
   * - `conjunction` (read: "and") - default
   * - `disjunction` (read: "or")
   * - `unit` (just a list)
   */
  type?: Intl.ListFormatType | undefined

  /**
   * The length of the internationalized message.
   * This obviously varies based on language, but in US English this maps to:
   * - `long`: "a, b and c" - default
   * - `short`: "a, b & c"
   * - `narrow`: `a, b, c`
   */
  style?: Intl.ListFormatStyle | undefined
}

/**
 * Returns an instance of `Intl.ListFormat` that uses the currently selected locale,
 * and enables language-sensitive list formatting.
 *
 * @param options - Optional options for the list formatter
 * @returns Instance of `Intl.ListFormat`
 * @public
 */
export function useListFormat(options: UseListFormatOptions = {}): Intl.ListFormat {
  const currentLocale = useCurrentLocale().id
  return intlCache.listFormat(currentLocale, options)
}
