import {useTranslation} from './useTranslation'

/** @internal */
export interface I18nTitle {
  i18n?: {key: string; ns: string}
  title: string
}

/** @internal */
export function useI18nTitle({title, i18n}: I18nTitle): string {
  const {t} = useTranslation(i18n?.ns)
  return i18n
    ? t(i18n.key, {
        ns: i18n.ns,
        // fallback to the normal title if the i18n key isn't found
        defaultValue: title,
      })
    : title
}
