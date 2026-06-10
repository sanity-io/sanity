import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for variants.
 *
 * @internal
 */
// oxlint-disable-next-line prefer-as-const
export const variantsLocaleNamespace: 'variants' = 'variants'

/**
 * The default locale resource for variants, which is US English.
 *
 * @internal
 */
export const variantsUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: variantsLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for variants.
 *
 * @alpha
 * @hidden
 */
export type {VariantsLocaleResourceKeys} from './resources'
