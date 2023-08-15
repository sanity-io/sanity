import {defineLocaleResourceBundle} from 'sanity'

/**
 * The locale namespace for the vision tool
 *
 * @public
 */
export const visionLocaleNamespace = 'vision' as const

/**
 * The default locale bundle for the vision tool, which is US English.
 *
 * @internal
 */
export const visionUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: visionLocaleNamespace,
  resources: () => import('./resources'),
})

/**
 * The locale resource keys for the desk tool.
 *
 * @alpha
 * @hidden
 */
export type {VisionLocaleResourceKeys} from './resources'
