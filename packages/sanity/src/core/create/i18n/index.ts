import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the Create integration plugin
 *
 * @public
 */
export const createLocaleNamespace = 'create' as const

/**
 * The default locale bundle for the Create integration plugin, which is US English.
 *
 * @internal
 */
export const createUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: createLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the Create integration plugin.
 *
 * @alpha
 * @hidden
 */
export type {CreateLocaleResourceKeys} from './resources'
