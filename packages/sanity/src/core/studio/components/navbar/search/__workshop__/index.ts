import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/studio/navbar/search',
  title: 'Search',
  stories: [
    {
      name: 'autocomplete',
      title: 'Autocomplete',
      component: lazy(() => import('./AutocompleteStory')),
    },
    {
      name: 'filterButton',
      title: 'FilterButton',
      component: lazy(() => import('./FilterButtonStory')),
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
