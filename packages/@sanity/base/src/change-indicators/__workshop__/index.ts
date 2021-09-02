import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/change-indicators', 'Change indicators', [
  {
    name: 'change-bar',
    title: 'ChangeBar',
    component: lazy(() => import('./example')),
  },
  {
    name: 'change-connector',
    title: 'ChangeConnector',
    component: lazy(() => import('./changeConnector')),
  },
])
