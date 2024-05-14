import {PinIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'

import {ListenerDebug} from './ListenerDebug'
import {type ListenerDebugConfig} from './types'

/**
 * Router playground/debug plugin
 */
export const listenerDebugTool = definePlugin<ListenerDebugConfig | void>((options) => {
  const {name, title, icon} = options || {}

  return {
    name: 'listener-debug',
    tools: [
      {
        name: name || 'listener-debug',
        title: title || 'Listener debug',
        icon: icon || PinIcon,
        component: ListenerDebug,
      },
    ],
  }
})
