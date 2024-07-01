import {route} from 'sanity/router'

import {definePlugin} from '../../config'
import {TOOL_NAME, TOOL_TITLE} from '../constants'
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
      name: TOOL_NAME,
      title: TOOL_TITLE,
      component: ReleasesTool,
      router: route.create('/', [route.create('/:bundleId')]),
    },
  ],
})
