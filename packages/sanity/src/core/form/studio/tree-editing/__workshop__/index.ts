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

    {
      name: 'tree-editing-breadcrumbs',
      title: 'TreeEditingBreadCrumbs',
      component: lazy(() => import('./TreeEditingBreadCrumbsStory')),
    },
    {
      name: 'tree-menu-items-build-debug',
      title: 'Tree menu items build debug',
      component: lazy(() => import('./TreeMenuItemsBuildDebugStory')),
    },
  ],
})
