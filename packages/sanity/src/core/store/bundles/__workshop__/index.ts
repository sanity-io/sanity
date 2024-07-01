import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/bundles',
  title: 'bundles',
  stories: [
    {
      name: 'bundles-store',
      title: 'BundlesStore',
      component: lazy(() => import('./BundlesStoreStory')),
    },
  ],
})
