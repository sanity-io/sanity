import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the DiffView plugin.
 *
 * @public
 */
export const diffViewLocaleNamespace = 'diffView' as const

/**
 * The default locale bundle for the DiffView plugin, which is US English.
 *
 * @internal
 */
export const diffViewUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: diffViewLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the DiffView plugin.
 *
 * @alpha
 * @hidden
 */
export type {DiffViewLocaleResourceKeys} from './resources'
