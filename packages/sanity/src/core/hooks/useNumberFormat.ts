import {intlCache} from '../i18n/intlCache'
import {useCurrentLocale} from '../i18n/hooks/useLocale'

/**
 * Options for the `useNumberFormat` hook
 *
 * @public
 */
export type UseNumberFormatOptions = Intl.NumberFormatOptions

/**
 * Returns an instance of `Intl.NumberFormat` that uses the currently selected locale,
 * and enables locale/language-sensitive number formatting.
 *
 * @param options - Optional options for the number formatter
 * @returns Instance of `Intl.NumberFormat`
 * @public
 */
export function useNumberFormat(options: UseNumberFormatOptions = {}): Intl.NumberFormat {
  const currentLocale = useCurrentLocale().id
  return intlCache.numberFormat(currentLocale, options)
}
