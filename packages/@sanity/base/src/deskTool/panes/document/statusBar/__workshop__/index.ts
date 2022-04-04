import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('desk-tool/status-bar', 'StatusBar', [
  {
    name: 'review-changes-button',
    title: 'ReviewChangesButton',
    component: lazy(() => import('./ReviewChangesButtonStory')),
  },
])
