import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/desk/core',
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
  ],
})
