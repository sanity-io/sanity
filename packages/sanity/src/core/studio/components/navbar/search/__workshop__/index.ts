import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/studio/navbar/search', 'Search', [
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
])
