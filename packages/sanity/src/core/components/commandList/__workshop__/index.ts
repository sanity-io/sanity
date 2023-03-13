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
      name: 'popover',
      title: 'Popover',
      component: lazy(() => import('./PopoverStory')),
    },
    {
      name: 'infinite-scroll',
      title: 'Infinite Scroll',
      component: lazy(() => import('./InfiniteScrollStory')),
    },
    {
      name: 'kitchen-sink',
      title: 'Filterable, Selectable with disabled items',
      component: lazy(() => import('./KitchenSinkStory')),
    },
  ],
})
