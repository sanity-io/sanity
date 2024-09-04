import {route} from 'sanity/router'

import {definePlugin} from '../../config'
import {releasesUsEnglishLocaleBundle} from '../i18n'
import {ReleasesTool} from '../tool/ReleasesTool'
import {ReleasesStudioLayout} from './ReleasesStudioLayout'

/**
 * @internal
 */
export const RELEASES_NAME = 'sanity/releases'

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
      name: 'releases',
      title: 'Releases',
      component: ReleasesTool,
      router: route.create('/', [route.create('/:releaseId')]),
      canHandleIntent: (intent) => {
        // If intent is release, open the releases tool.
        return Boolean(intent === 'release')
      },
      getIntentState(intent, params) {
        if (intent === 'release') {
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
