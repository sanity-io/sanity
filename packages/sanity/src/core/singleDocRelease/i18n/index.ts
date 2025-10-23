import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the releases tool
 *
 * @public
 */
// api extractor take issues with 'as const' for literals
// oxlint-disable-next-line prefer-as-const
export const singleDocReleaseNamespace: 'singleDocRelease' = 'singleDocRelease'

/**
 * The default locale release for the single doc release tool, which is US English.
 *
 * @internal
 */
export const singleDocReleaseUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: singleDocReleaseNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the single doc release tool.
 *
 * @alpha
 * @hidden
 */
export type {SingleDocReleaseLocaleResourceKeys} from './resources'
