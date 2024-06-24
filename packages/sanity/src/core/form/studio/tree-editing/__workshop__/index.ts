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
      name: 'tree-editing-search',
      title: 'TreeEditingSearch',
      component: lazy(() => import('./TreeEditingSearchStory')),
    },
    {
      name: 'tree-editing-layout',
      title: 'TreeEditingLayout',
      component: lazy(() => import('./TreeEditingLayoutStory')),
    },
    {
      name: 'tree-editing-breadcrumbs',
      title: 'TreeEditingBreadcrumbs',
      component: lazy(() => import('./TreeEditingBreadcrumbsStory')),
    },
    {
      name: 'tree-editing-breadcrumbs-menu',
      title: 'TreeEditingBreadcrumbsMenu',
      component: lazy(() => import('./TreeEditingBreadcrumbsMenuStory')),
    },
    {
      name: 'tree-editing-breadcrumbs-menu-button',
      title: 'TreeEditingBreadcrumbsMenuButtonStory',
      component: lazy(() => import('./TreeEditingBreadcrumbsMenuButtonStory')),
    },
  ],
})
