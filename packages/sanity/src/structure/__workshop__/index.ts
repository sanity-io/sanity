import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'structure/core',
  title: 'Core',
  stories: [
    {
      name: 'resolve-panes',
      title: 'Resolve panes',
      component: lazy(() => import('./ResolvePanesStory')),
    },
    {
      name: 'document-state',
      title: 'Document state',
      component: lazy(() => import('./DocumentStateStory')),
    },
    {
      name: 'loading-pane',
      title: 'Loading pane',
      component: lazy(() => import('./LoadingPaneStory')),
    },
  ],
})
