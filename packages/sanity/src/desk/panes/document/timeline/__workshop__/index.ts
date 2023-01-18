import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/desk/documentTimelineMenu',
  title: 'Document Timeline Menu',
  stories: [
    {
      name: 'default',
      title: 'Default',
      component: lazy(() => import('./DefaultStory')),
    },
  ],
})
