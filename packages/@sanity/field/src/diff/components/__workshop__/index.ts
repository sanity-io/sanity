import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('field/components', 'components', [
  {
    name: 'change-bread-crumb',
    title: 'ChangeBreadCrumb',
    component: lazy(() => import('./ChangeBreadCrumbStory')),
  },
])
