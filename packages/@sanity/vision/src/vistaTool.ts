import './styles.css'

import {TerminalIcon} from '@sanity/icons/Terminal'
import {lazy} from 'react'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {visionUsEnglishLocaleBundle} from './i18n'
import {type VistaToolConfig} from './types'

/**
 * Experimental redesign of the Vision GROQ playground: query tabs, a collapsible sidebar with
 * saved and shared queries, live refetching through sync tags, and export helpers.
 *
 * Opt-in: `visionTool` is unaffected. The two tools can run side by side in the same studio, since
 * this one registers as `vista` by default.
 *
 * @beta
 */
export const experimental_vistaTool = definePlugin<VistaToolConfig | void>((options) => {
  const {name, title, icon, ...config} = options || {}
  return {
    name: '@sanity/vision/vista',
    tools: [
      {
        name: name || 'vista',
        title: title || 'Vista',
        icon: icon || TerminalIcon,
        component: lazy(() => import('./SanityVista')),
        options: config,
        router: route.create('/*'),
        __internalApplicationType: 'sanity/vista',
      },
    ],
    i18n: {
      bundles: [visionUsEnglishLocaleBundle],
    },
  }
})
