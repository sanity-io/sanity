import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'desk/panes/status-bar',
  title: 'StatusBar',
  stories: [
    {
      name: 'document-actions',
      title: 'Document actions',
      component: lazy(() => import('./DocumentActionsStory')),
    },
    {
      name: 'document-badges',
      title: 'Document badges',
      component: lazy(() => import('./DocumentBadgesStory')),
    },
    {
      name: 'review-changes-button',
      title: 'ReviewChangesButton',
      component: lazy(() => import('./ReviewChangesButtonStory')),
    },
  ],
})
