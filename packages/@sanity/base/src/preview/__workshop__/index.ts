import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/preview', 'Preview', [
  {
    name: 'sanity-preview',
    title: 'SanityPreview',
    component: lazy(() => import('./SanityPreviewStory')),
  },
])
