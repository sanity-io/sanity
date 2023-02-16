import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/text-with-tone',
  title: 'TextWithTone',
  stories: [
    {
      name: 'default',
      title: 'Default',
      component: lazy(() => import('./TextWithToneStory')),
    },
  ],
})
