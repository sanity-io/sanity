import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the releases tool
 *
 * @public
 */
export const releasesLocaleNamespace = 'releases' as const

/**
 * The default locale bundle for the releases tool, which is US English.
 *
 * @internal
 */
export const releasesUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: releasesLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the releases tool.
 *
 * @alpha
 * @hidden
 */
export type {ReleasesLocaleResourceKeys} from './resources'
