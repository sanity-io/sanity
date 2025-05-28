import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the releases tool
 *
 * @public
 */
// api extractor take issues with 'as const' for literals
// eslint-disable-next-line @typescript-eslint/prefer-as-const
export const releasesLocaleNamespace: 'releases' = 'releases'

/**
 * The default locale release for the releases tool, which is US English.
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
