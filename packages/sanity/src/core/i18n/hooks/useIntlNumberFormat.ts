import {intlCache} from '../intlCache'
import {useCurrentLocale} from './useLocale'

/**
 * Options for the `useIntlNumberFormat` hook
 *
 * @public
 */
export type UseIntlNumberFormatOptions = Intl.NumberFormatOptions

/**
 * Returns an instance of `Intl.NumberFormat` that uses the currently selected locale,
 * and enables locale/language-sensitive number formatting.
 *
 * @param options - Optional options for the number formatter
 * @returns Instance of `Intl.NumberFormat`
 * @public
 */
export function useIntlNumberFormat(options: UseIntlNumberFormatOptions = {}): Intl.NumberFormat {
  const currentLocale = useCurrentLocale()
  return intlCache.numberFormat(currentLocale, options)
}
