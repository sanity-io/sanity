import {type LocaleResourceBundle} from '../../../core/i18n'

/**
 * The locale namespace for the media library plugin.
 *
 * @internal
 */
// oxlint-disable-next-line prefer-as-const
export const mediaLibraryLocaleNamespace: 'media-library' = 'media-library'

/**
 * The default locale bundle for the media library plugin, which is US English.
 *
 * @internal
 */
export const mediaLibraryUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: mediaLibraryLocaleNamespace,
  resources: () => import('./resources'),
}
