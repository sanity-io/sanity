import {route} from 'sanity/router'

import {definePlugin} from '../../config'
import {ReleasesTool} from '../tool/ReleasesTool'

/**
 * @internal
 */
export const RELEASES_NAME = 'sanity/releases'

/**
 * @internal
 */
export const releases = definePlugin({
  name: RELEASES_NAME,
  tools: [
    {
      name: 'releases',
      title: 'Releases',
      component: ReleasesTool,
      router: route.create('/', [route.create('/:bundleId')]),
    },
  ],
})
