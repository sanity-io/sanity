import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/rovingFocus',
  title: 'Roving focus',
  stories: [
    {
      name: 'roving-focus',
      title: 'Default',
      component: lazy(() => import('./RovingFocusStory')),
    },
  ],
})
