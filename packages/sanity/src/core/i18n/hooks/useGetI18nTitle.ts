import {useCallback, useMemo} from 'react'
import {isNonNullable} from '../../util'
import {useTranslation} from './useTranslation'
import {I18nTitle} from './useI18nTitle'

/** @internal */
export function useGetI18nTitle(
  input: I18nTitle | undefined | Array<I18nTitle | undefined>,
): (i: I18nTitle) => string {
  const items = Array.isArray(input) ? input : [input]
  const stableNamespaces = JSON.stringify(
    items
      .map((item) => item?.i18n?.ns)
      .filter(isNonNullable)
      .sort(),
  )
  const namespaces = useMemo(() => JSON.parse(stableNamespaces), [stableNamespaces])
  const {t} = useTranslation(namespaces)

  return useCallback(
    function getI18nTitle({title, i18n}: I18nTitle) {
      return i18n
        ? t(i18n.key, {
            ns: i18n.ns,
            // fallback to the normal title if the i18n key isn't found
            defaultValue: title,
          })
        : title
    },
    [t],
  )
}
