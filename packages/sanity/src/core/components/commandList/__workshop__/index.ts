import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/command-list',
  title: 'CommandList',
  stories: [
    {
      name: 'default',
      title: 'Default',
      component: lazy(() => import('./DefaultStory')),
    },
    {
      name: 'button',
      title: 'Button',
      component: lazy(() => import('./ButtonStory')),
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
