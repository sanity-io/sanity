import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the DiffView plugin, in US English.
 *
 * @internal
 */
const diffViewLocaleStrings = defineLocalesResources('diffView', {
  /** The title used when comparing versions of a document */
  'compare-versions.title': 'Compare versions',
  /** The string used to label draft documents */
  'compare-versions.status.draft': 'Draft',
  /** The string used to label published documents */
  'compare-versions.status.published': 'Published',
})

/**
 * @alpha
 */
export type DiffViewLocaleResourceKeys = keyof typeof diffViewLocaleStrings

export default diffViewLocaleStrings
