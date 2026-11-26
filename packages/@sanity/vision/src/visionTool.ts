import './styles.css'

import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {lazy} from 'react'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {visionUsEnglishLocaleBundle} from './i18n'
import {type VisionToolConfig} from './types'

let hasWarnedAboutRedesign = false

export const visionTool = definePlugin<VisionToolConfig | void>((options) => {
  const {name, title, icon, ...config} = options || {}
  if (
    process.env.NODE_ENV !== 'production' &&
    // oxlint-disable-next-line no-deprecated -- reads the option only to warn that it does nothing
    config.beta?.redesign &&
    !hasWarnedAboutRedesign
  ) {
    hasWarnedAboutRedesign = true
    console.warn(
      '[@sanity/vision] `beta.redesign` has no effect: Vision always shows the classic tool. Remove it from the `visionTool()` config.',
    )
  }
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
        __internalApplicationType: 'sanity/vision',
      },
    ],
    i18n: {
      bundles: [visionUsEnglishLocaleBundle],
    },
  }
})
