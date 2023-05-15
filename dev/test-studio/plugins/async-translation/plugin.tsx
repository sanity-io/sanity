import {definePlugin} from 'sanity'
import {EarthGlobeIcon} from '@sanity/icons'
import {lazy} from 'react'

export const asyncTranslationTool = definePlugin({
  name: '@local/async-translation',
  tools: [
    {
      name: 'async-i18n',
      title: 'I18n',
      icon: EarthGlobeIcon,
      component: lazy(() => import('./I18nLazyParent')),
    },
  ],
})
