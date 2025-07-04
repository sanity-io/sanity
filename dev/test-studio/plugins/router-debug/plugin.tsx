import {PinIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {RouterDebug} from './RouterDebug'
import {type RouterDebugConfig} from './types'

/**
 * Router playground/debug plugin
 */
export const routerDebugTool = definePlugin<RouterDebugConfig | void>((options) => {
  const {name, title, icon} = options || {}

  return {
    name: 'router-debug',
    tools: [
      {
        name: name || 'router-debug',
        title: title || 'Router debug',
        icon: icon || PinIcon,
        component: RouterDebug,
        canHandleIntent: (intent) => {
          return intent === 'router-debug-please'
        },
        getIntentState: (_intent, params) => {
          return {
            section: 'from-intent',
            _searchParams: [
              ['intentResolved', 'yes'],
              ['paramFromIntent', params.favorite],
            ],
          }
        },
        router: route.create('/', [
          route.create('/section/:section'),
          route.scope('some-plugin', '/', [route.create('/', route.create('/:pluginParam'))]),
        ]),
      },
    ],
  }
})
