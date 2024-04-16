import {EyeOpenIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {visionUsEnglishLocaleBundle} from './i18n'
import {type VisionToolConfig} from './types'

export const visionTool = definePlugin<VisionToolConfig | void>((options) => {
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
        // eslint-disable-next-line camelcase
        router: route.create('/*', {__unsafe_disableScopedSearchParams: true}),
      },
    ],
    i18n: {
      bundles: [visionUsEnglishLocaleBundle],
    },
  }
})
