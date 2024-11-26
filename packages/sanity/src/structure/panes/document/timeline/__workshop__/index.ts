import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'structure/panes/documentTimelineMenu',
  title: 'Document Timeline Menu',
  stories: [
    {
      name: 'default',
      title: 'Default',
      component: lazy(() => import('./DefaultStory')),
    },
    {
      name: 'timelineItem',
      title: 'Timeline Item',
      component: lazy(() => import('./TimelineItemStory')),
    },
  ],
})
