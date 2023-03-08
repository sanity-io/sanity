import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/command-list',
  title: 'CommandList',
  stories: [
    {
      name: 'minimal',
      title: 'Minimal',
      component: lazy(() => import('./MinimalStory')),
    },
    {
      name: 'filterable',
      title: 'Filterable',
      component: lazy(() => import('./FilterableStory')),
    },
    {
      name: 'filterableButtons',
      title: 'Filterable Buttons',
      component: lazy(() => import('./FilterableButtonsStory')),
    },
    {
      name: 'popover',
      title: 'Popover',
      component: lazy(() => import('./PopoverStory')),
    },
    {
      name: 'selectable',
      title: 'Selectable',
      component: lazy(() => import('./SelectableStory')),
    },
  ],
})
