import {definePlugin} from '../../config'
import {diffViewUsEnglishLocaleBundle} from '../i18n'
import {DiffViewDocumentLayout} from './DiffViewDocumentLayout'

/**
 * @internal
 */
export const DIFF_VIEW_NAME = 'sanity/diffView'

/**
 * @internal
 */
export const DIFF_VIEW_TOOL_NAME = 'diffView'

/**
 * @internal
 */
export const DIFF_VIEW_INTENT = 'diffView'

/**
 * @internal
 */
export const diffView = definePlugin({
  name: DIFF_VIEW_NAME,
  document: {
    components: {
      unstable_layout: DiffViewDocumentLayout,
    },
  },
  i18n: {
    bundles: [diffViewUsEnglishLocaleBundle],
  },
})
