/**
 * Unstable export surface for reading Studio translations and locale-aware formatting in an app
 * outside the Studio, without pulling in any UI, stylesheets or data stores. The hooks read the
 * same `LocaleContext` and `react-i18next` instances as `sanity/_unstable-embedded`, so they
 * resolve against whichever locale provider an ancestor renders. Like other underscore-prefixed
 * entries this is not considered part of the public API — exports may be added, changed or removed
 * in any release without notice.
 */
export {useDateTimeFormat, type UseDateTimeFormatOptions} from '../core/hooks/useDateTimeFormat'
export {type RelativeTimeOptions, useRelativeTime} from '../core/hooks/useRelativeTime'
export {type StudioLocaleResourceKeys} from '../core/i18n/bundles/studio'
export {useCurrentLocale} from '../core/i18n/hooks/useLocale'
export {
  useTranslation,
  type UseTranslationOptions,
  type UseTranslationResponse,
} from '../core/i18n/hooks/useTranslation'
export {Translate, type TranslateComponentMap, type TranslationProps} from '../core/i18n/Translate'
