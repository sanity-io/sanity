import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/preview-card',
  title: 'PreviewCard',
  stories: [
    {
      name: 'preview-card',
      title: 'Default',
      component: lazy(() => import('./PreviewCardStory')),
    },
  ],
})
