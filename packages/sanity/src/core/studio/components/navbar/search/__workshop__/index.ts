import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/studio/navbar/search',
  title: 'Search',
  stories: [
    {
      name: 'miniReferenceInput',
      title: 'MiniReferenceInput',
      component: lazy(() => import('./MiniReferenceInputStory')),
    },
    {
      name: 'searchPopover',
      title: 'SearchPopover',
      component: lazy(() => import('./SearchPopoverStory')),
    },
    {
      name: 'searchDialog',
      title: 'SearchDialog',
      component: lazy(() => import('./SearchDialogStory')),
    },
  ],
})
