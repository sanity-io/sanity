import {definePlugin} from 'sanity'
import {PinIcon} from '@sanity/icons'
import {route} from 'sanity/router'
import {RouterDebugConfig} from './types'
import RouterDebug from './RouterDebug'

/**
 * Presence playground plugin
 */
export const routerDebugTool = definePlugin<RouterDebugConfig | void>((options) => {
  const {name, title, icon} = options || {}

  return {
    name: '@local/presence',
    tools: [
      {
        name: name || 'router-debug',
        title: title || 'Router debug',
        icon: icon || PinIcon,
        component: RouterDebug,
        canHandleIntent: (intent, params) => {
          return intent === 'router-debug-please'
        },
        getIntentState: (intent, params) => {
          return {
            section: 'from-intent',
            _searchParams: [
              ['intentResolved', 'yes'],
              ['paramFromIntent', params.favorite],
            ],
          }
        },
        router: route.create(
          '/',
          // eslint-disable-next-line camelcase
          {__unsafe_disableScopedSearchParams: true},
          [
            route.create('/section/:section'),
            route.scope('some-plugin', '/', [route.create('/', route.create('/:pluginParam'))]),
          ],
        ),
      },
    ],
  }
})
