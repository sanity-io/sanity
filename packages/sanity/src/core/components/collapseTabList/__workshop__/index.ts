import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/collapseTabList',
  title: 'CollapseTabList',
  stories: [
    {
      name: 'collapse-tab-list',
      title: 'Default',
      component: lazy(() => import('./CollapseTabListStory')),
    },
  ],
})
