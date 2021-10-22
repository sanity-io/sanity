import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('desk-tool/timeline', 'timeline', [
  {
    name: 'timeline-item',
    title: 'TimelineItem',
    component: lazy(() => import('./TimelineItemStory')),
  },
])
