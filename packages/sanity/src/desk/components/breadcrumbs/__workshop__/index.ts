import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'desk/components/Breadcrumbs',
  title: 'Breadcrumbs',
  stories: [
    {
      name: 'normal',
      title: 'Breadcrumbs',
      component: lazy(() => import('./BreadcrumbsStory')),
    },
  ],
})
