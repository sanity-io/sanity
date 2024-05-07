import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/form/tree-editing',
  title: 'Tree editing',
  stories: [
    {
      name: 'tree-editing-menu',
      title: 'TreeEditingMenu',
      component: lazy(() => import('./TreeEditingMenuStory')),
    },
    {
      name: 'tree-editing-layout',
      title: 'TreeEditingLayout',
      component: lazy(() => import('./TreeEditingLayoutStory')),
    },
  ],
})
