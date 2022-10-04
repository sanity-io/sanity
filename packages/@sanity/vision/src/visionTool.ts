import {lazy} from 'react'
import {createPlugin} from 'sanity'
import {route} from 'sanity/router'
import {EyeOpenIcon} from '@sanity/icons'
import {VisionToolConfig} from './types'

export const visionTool = createPlugin<VisionToolConfig | void>((options) => {
  const {name, title, icon, ...config} = options || {}
  return {
    name: '@sanity/vision',
    tools: [
      {
        name: name || 'vision',
        title: title || 'Vision',
        icon: icon || EyeOpenIcon,
        component: lazy(() => import('./SanityVision')),
        options: config,
        router: route.create('/*'),
      },
    ],
  }
})
