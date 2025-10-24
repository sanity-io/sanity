import {definePlugin} from '../../config/definePlugin'
import resolveDocumentActions from './documentActions'

/**
 * @internal
 */
export const RELEASES_NAME = 'sanity/releases'

/**
 * @internal
 */
export const RELEASES_INTENT = 'release'

/**
 * @internal
 */
export const releases = definePlugin({
  name: RELEASES_NAME,
  document: {
    actions: (actions, context) => resolveDocumentActions(actions, context),
  },
})
