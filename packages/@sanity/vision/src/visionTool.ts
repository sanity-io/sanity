// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import './styles.css'

import {EyeOpenIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin, ensureCdnCssLink} from 'sanity'
import {route} from 'sanity/router'

import {visionUsEnglishLocaleBundle} from './i18n'
import {type VisionToolConfig} from './types'

// Inject a CSS <link> tag when @sanity/vision is loaded from sanity-cdn and the
// auto-updates runtime script in the host HTML did not already inject one.
// See sanity's ensureCdnCssLink helper for details.
ensureCdnCssLink(import.meta.url, '@sanity__vision')

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
        router: route.create('/*'),
        __internalApplicationType: 'sanity/vision',
      },
    ],
    i18n: {
      bundles: [visionUsEnglishLocaleBundle],
    },
  }
})
