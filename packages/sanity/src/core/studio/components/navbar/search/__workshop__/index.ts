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
      name: 'commonDateDirection',
      title: 'CommonDateDirection',
      component: lazy(() => import('./CommonDateDirectionStory')),
    },
    {
      name: 'commonDateEqual',
      title: 'CommonDateEqual',
      component: lazy(() => import('./CommonDateEqualStory')),
    },
    {
      name: 'commonDateRange',
      title: 'CommonDateRange',
      component: lazy(() => import('./CommonDateRangeStory')),
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
