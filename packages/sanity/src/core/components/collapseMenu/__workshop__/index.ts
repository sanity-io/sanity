import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/collapseMenu',
  title: 'CollapseMenu',
  stories: [
    {
      name: 'collapse-menu',
      title: 'Default',
      component: lazy(() => import('./CollapseMenuStory')),
    },
  ],
})
