import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/form/array-editing',
  title: 'Array editing',
  stories: [
    {
      name: 'array-editing-layout',
      title: 'ArrayEditingLayout',
      component: lazy(() => import('./ArrayEditingLayoutStory')),
    },
    {
      name: 'array-editing-breadcrumbs',
      title: 'ArrayEditingBreadcrumbs',
      component: lazy(() => import('./ArrayEditingBreadcrumbsStory')),
    },
    {
      name: 'array-editing-breadcrumbs-menu',
      title: 'ArrayEditingBreadcrumbsMenu',
      component: lazy(() => import('./ArrayEditingBreadcrumbsMenuStory')),
    },
    {
      name: 'array-editing-breadcrumbs-menu-button',
      title: 'ArrayEditingBreadcrumbsMenuButtonStory',
      component: lazy(() => import('./ArrayEditingBreadcrumbsMenuButtonStory')),
    },
  ],
})
