import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {releasesUsEnglishLocaleBundle} from '../i18n'
import {ReleasesTool} from '../tool/ReleasesTool'
import resolveDocumentActions from './documentActions'
import {ReleasesStudioLayout} from './ReleasesStudioLayout'

/**
 * @internal
 */
export const RELEASES_NAME = 'sanity/releases'

/**
 * @internal
 */
export const RELEASES_TOOL_NAME = 'releases'

/**
 * @internal
 */
export const RELEASES_INTENT = 'release'

/**
 * @internal
 */
export const RELEASES_SCHEDULED_DRAFTS_INTENT = 'releases-scheduled-drafts'

/**
 * @internal
 */
export const releases = definePlugin({
  name: RELEASES_NAME,
  studio: {
    components: {
      layout: ReleasesStudioLayout,
    },
  },
  tools: [
    {
      name: RELEASES_TOOL_NAME,
      title: 'Releases',
      component: ReleasesTool,
      router: route.create('/', [route.create('/:releaseId')]),
      canHandleIntent: (intent) =>
        Boolean(intent === RELEASES_INTENT || intent === RELEASES_SCHEDULED_DRAFTS_INTENT),
      getIntentState(intent, params) {
        if (intent === RELEASES_INTENT) {
          return {releaseId: params.id}
        }
        if (intent === RELEASES_SCHEDULED_DRAFTS_INTENT) {
          // Handle view parameter and convert to search params
          const searchParams = []
          if (params.view) {
            searchParams.push(['view', params.view])
          }
          return {
            _searchParams: searchParams,
          }
        }
        return null
      },
    },
  ],
  i18n: {
    bundles: [releasesUsEnglishLocaleBundle],
  },
  document: {
    actions: (actions, context) => resolveDocumentActions(actions, context),
  },
})
