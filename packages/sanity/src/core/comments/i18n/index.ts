import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the comments plugin
 *
 * @public
 */
export const commentsLocaleNamespace = 'comments' as const

/**
 * The default locale bundle for the comments plugin, which is US English.
 *
 * @internal
 */
export const commentsUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: commentsLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the comments plugin.
 *
 * @alpha
 * @hidden
 */
export type {CommentsLocaleResourceKeys} from './resources'
