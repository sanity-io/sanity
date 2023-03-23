import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/store/datastores',
  title: 'Datastores (legacy)',
  stories: [
    {
      name: 'current-user',
      title: 'Current user',
      component: lazy(() => import('./CurrentUserStory')),
    },
    {
      name: 'document-pair',
      title: 'Document pair',
      component: lazy(() => import('./DocumentPairStory')),
    },
    {
      name: 'document-permission',
      title: 'Document permission',
      component: lazy(() => import('./DocumentPermissionStory')),
    },
    {
      name: 'history',
      title: 'History',
      component: lazy(() => import('./HistoryStory')),
    },
    {
      name: 'history-timeline',
      title: 'History Timeline',
      component: lazy(() => import('./HistoryTimelineStory')),
    },
    {
      name: 'presence',
      title: 'Presence',
      component: lazy(() => import('./PresenceStory')),
    },
  ],
})
