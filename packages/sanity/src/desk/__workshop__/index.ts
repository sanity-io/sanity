import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/desk/core', 'Core', [
  {
    name: 'resolve-panes',
    title: 'Resolve panes',
    component: lazy(() => import('./ResolvePanesStory')),
  },
  {
    name: 'document-state',
    title: 'Document state',
    component: lazy(() => import('./DocumentStateStory')),
  },
])
