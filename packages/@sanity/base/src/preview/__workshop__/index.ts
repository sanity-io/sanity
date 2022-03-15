import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/preview', 'Preview', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./PreviewStory')),
  },
])
