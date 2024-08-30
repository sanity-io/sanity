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
      router: route.create('/', [route.create('/:bundleId')]),
      canHandleIntent: (intent, params) => {
        return Boolean(intent === 'release' && params.slug)
      },
      getIntentState(intent, params) {
        if (intent === 'release') {
          return {bundleId: params.slug}
        }
        return null
      },
    },
  ],
  i18n: {
    bundles: [releasesUsEnglishLocaleBundle],
  },
})
