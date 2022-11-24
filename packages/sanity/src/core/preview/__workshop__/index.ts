import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/preview',
  title: 'Preview',
  stories: [
    {
      name: 'sanity-preview',
      title: 'SanityPreview',
      component: lazy(() => import('./SanityPreviewStory')),
    },
  ],
})
