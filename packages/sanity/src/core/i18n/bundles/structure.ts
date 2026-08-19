import {defineLocaleResourceBundle} from '../helpers'
import {structureLocaleNamespace} from '../localeNamespaces'

/**
 * The default locale bundle for the `structure` namespace, which is US English.
 *
 * These strings historically lived in `sanity/structure` and were registered by
 * the `structureTool()` plugin. They are registered with the default locale so
 * that the document pane (and other pane primitives) can render localized
 * strings in any studio tool, without requiring the structure tool plugin.
 *
 * @internal
 * @hidden
 */
export const structureDefaultLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: structureLocaleNamespace,
  resources: () => import('./structureResources'),
})

export {type StructureLocaleResourceKeys} from './structureResources'
