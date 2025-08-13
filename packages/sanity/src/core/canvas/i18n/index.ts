import type {LocaleResourceBundle} from '../../i18n/types'

/**
 * The locale namespace for the canvas integration plugin
 *
 * @public
 */
export const canvasLocaleNamespace = 'canvas' as const

/**
 * The default locale bundle for the canvas integration plugin, which is US English.
 *
 * @internal
 */
export const canvasUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: canvasLocaleNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the canvas integration plugin.
 *
 * @alpha
 * @hidden
 */
export type {CanvasLocaleResourceKeys} from './resources'
