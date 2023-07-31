import {defineLocaleResourceBundle} from 'sanity'

/**
 * The locale namespace for the desk tool
 *
 * @public
 */
export const deskLocaleNamespace = 'desk' as const

/**
 * The default locale bundle for the desk tool, which is US English.
 *
 * @internal
 */
export const deskUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: deskLocaleNamespace,
  resources: () => import('./resources'),
})

/**
 * The locale resource keys for the desk tool.
 *
 * @alpha
 * @hidden
 */
export type {DeskLocaleResourceKeys} from './resources'
