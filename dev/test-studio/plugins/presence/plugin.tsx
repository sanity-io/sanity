import {lazy} from 'react'
import {createPlugin} from 'sanity'
import {JoystickIcon} from '@sanity/icons'
import {route} from 'sanity/router'
import {PresenceToolConfig} from './types'

const Presence3D = lazy(() => import('./Presence3D'))

/**
 * Presence playground plugin
 */
export const presenceTool = createPlugin<PresenceToolConfig | void>((options) => {
  const {name, title, icon} = options || {}

  return {
    name: '@local/presence',
    tools: [
      {
        name: name || 'presence',
        title: title || 'Presence',
        icon: icon || JoystickIcon,
        component: Presence3D,
        router: route.create('/*'),
      },
    ],
  }
})
