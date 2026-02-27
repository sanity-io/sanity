import {definePlugin} from '../../config/definePlugin'
import {singleDocReleaseUsEnglishLocaleBundle} from '../i18n'
import resolveDocumentActions from './documentActions'
import {SingleDocReleaseLayout} from './SingleDocReleaseLayout'

/**
 * @internal
 */
export const SINGLE_DOC_RELEASE_NAME = 'sanity/singleDocRelease'

/**
 * @internal
 */
export const RELEASES_SCHEDULED_DRAFTS_INTENT = 'releases-scheduled-drafts'

/**
 * @internal
 */
export const singleDocRelease = definePlugin({
  name: SINGLE_DOC_RELEASE_NAME,
  studio: {
    components: {
      layout: SingleDocReleaseLayout,
    },
  },
  i18n: {
    bundles: [singleDocReleaseUsEnglishLocaleBundle],
  },
  document: {
    actions: resolveDocumentActions,
  },
})
