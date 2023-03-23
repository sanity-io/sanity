import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'desk/panes/documentTimelineMenu',
  title: 'Document Timeline Menu',
  stories: [
    {
      name: 'default',
      title: 'Default',
      component: lazy(() => import('./DefaultStory')),
    },
  ],
})
