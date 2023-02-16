import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/preview',
  title: 'preview',
  stories: [
    {
      name: 'sanity-preview',
      title: 'SanityPreview',
      component: lazy(() => import('./SanityPreviewStory')),
    },
  ],
})
