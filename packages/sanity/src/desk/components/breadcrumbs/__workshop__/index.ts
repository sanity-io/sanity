import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'desk/breadcrumbs',
  title: 'Breadcrumbs',
  stories: [
    {
      name: 'normal',
      title: 'Breadcrumbs',
      component: lazy(() => import('./BreadcrumbsStory')),
    },
  ],
})
