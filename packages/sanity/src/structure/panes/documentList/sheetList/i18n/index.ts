import {type LocaleResourceBundle} from 'sanity'

/**
 * The locale namespace for the sheet list
 *
 * @public
 */
export const SheetListLocaleNamespace = 'sheetList' as const

/**
 * The default locale bundle for the sheet list, which is US English.
 *
 * @internal
 */
export const SheetListUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: SheetListLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the sheet list.
 *
 * @alpha
 * @hidden
 */
export type {SheetListLocaleResourceKeys} from './resources'
