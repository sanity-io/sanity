import {defineLocaleResourceBundle} from 'sanity'

/**
 * The locale namespace for the vision tool
 *
 * @internal
 */
export const visionLocaleNamespace = 'vision' as const

/**
 * The default locale release for the vision tool, which is US English.
 *
 * @internal
 */
export const visionUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: visionLocaleNamespace,
  resources: () => import('./resources'),
})
