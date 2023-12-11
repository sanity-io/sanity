import {intlCache} from '../i18n/intlCache'
import {useCurrentLocale} from '../i18n/hooks/useLocale'

/**
 * Options for the `useDateTimeFormat` hook
 *
 * @public
 */
export type UseDateTimeFormatOptions = Omit<Intl.DateTimeFormatOptions, 'fractionalSecondDigits'>

/**
 * Returns an instance of `Intl.DateTimeFormat` that uses the currently selected locale,
 * and enables locale and culture-sensitive date formatting.
 *
 * @param options - Optional options for the date/time formatter
 * @returns Instance of `Intl.DateTimeFormat`
 * @public
 */
export function useDateTimeFormat(options: UseDateTimeFormatOptions = {}): Intl.DateTimeFormat {
  const currentLocale = useCurrentLocale().id
  return intlCache.dateTimeFormat(currentLocale, options)
}
