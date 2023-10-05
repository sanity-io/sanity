import {useMemo} from 'react'
import {useCurrentLocale} from './useLocale'

/**
 * Options for the `useIntlListFormat` hook
 *
 * @public
 */
export interface UseIntlListFormatOptions {
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
export function useIntlListFormat(options?: UseIntlListFormatOptions): Intl.ListFormat {
  const currentLocale = useCurrentLocale()

  // @todo Consider memoizing this "globally", since these can be a little costly to create,
  // and the limited set of options makes them highly reusable
  return useMemo(
    () => new Intl.ListFormat(currentLocale, {style: options?.style, type: options?.type}),
    [currentLocale, options?.style, options?.type],
  )
}
