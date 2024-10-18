import {route} from 'sanity/router'

import {definePlugin} from '../../config'
import {releasesUsEnglishLocaleBundle} from '../i18n'
import {ReleasesStudioNavbar} from '../navbar/ReleasesStudioNavbar'
import {ReleasesTool} from '../tool/ReleasesTool'
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
export const releases = definePlugin({
  name: RELEASES_NAME,
  studio: {
    components: {
      layout: ReleasesStudioLayout,
      navbar: ReleasesStudioNavbar,
    },
  },
  tools: [
    {
      name: RELEASES_TOOL_NAME,
      title: 'Releases',
      component: ReleasesTool,
      router: route.create('/', [route.create('/:releaseId')]),
      canHandleIntent: (intent) => {
        // If intent is release, open the releases tool.
        return Boolean(intent === RELEASES_INTENT)
      },
      getIntentState(intent, params) {
        if (intent === RELEASES_INTENT) {
          return {releaseId: params.id}
        }
        return null
      },
    },
  ],
  i18n: {
    bundles: [releasesUsEnglishLocaleBundle],
  },
})
