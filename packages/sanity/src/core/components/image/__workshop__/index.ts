import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/image',
  title: 'Image',
  stories: [
    {
      name: 'image',
      title: 'Default',
      component: lazy(() => import('./ImageStory')),
    },
  ],
})
