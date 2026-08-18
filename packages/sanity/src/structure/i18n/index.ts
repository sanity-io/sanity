import {structureDefaultLocaleResources, structureLocaleNamespace} from 'sanity'

/**
 * The locale namespace for the structure tool
 *
 * @public
 */
export {structureLocaleNamespace}

/**
 * The default locale bundle for the structure tool, which is US English.
 *
 * The resources now live in core (registered with the default locale) so the
 * pane primitives can render localized strings in any tool; this alias is kept
 * for backwards compatibility.
 *
 * @internal
 */
export const structureUsEnglishLocaleBundle = structureDefaultLocaleResources

/**
 * The locale resource keys for the structure tool.
 *
 * @alpha
 * @hidden
 */
export {type StructureLocaleResourceKeys} from 'sanity'
