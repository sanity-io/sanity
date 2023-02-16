import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/changeIndicators',
  title: 'changeIndicators',
  stories: [
    {
      name: 'change-bar-story',
      title: 'ChangeBar',
      component: lazy(() => import('./ChangeBarStory')),
    },
    {
      name: 'change-connector',
      title: 'ChangeConnector',
      component: lazy(() => import('./ChangeConnectorStory')),
    },
  ],
})
