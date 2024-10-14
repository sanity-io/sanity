import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/store/document-group-events',
  title: 'Documents group events',
  stories: [
    {
      name: 'get-document-events',
      title: 'Document group events',
      component: lazy(() => import('./DocumentGroupEvent')),
    },
  ],
})
