import {defineLocaleResourceBundle} from 'sanity'

/**
 * The locale namespace for the structure tool
 *
 * @public
 */
export const structureLocaleNamespace = 'structure' as const

/**
 * The default locale bundle for the structure tool, which is US English.
 *
 * @internal
 */
export const structureUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: structureLocaleNamespace,
  resources: () => import('./resources'),
})

/**
 * The locale resource keys for the structure tool.
 *
 * @alpha
 * @hidden
 */
export type {StructureLocaleResourceKeys} from './resources'
