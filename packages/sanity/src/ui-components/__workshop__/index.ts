import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'studio-ui',
  title: 'Studio UI',
  stories: [
    {
      name: 'button',
      title: 'Button',
      component: lazy(() => import('./ButtonStory')),
    },
    {
      name: 'dialog',
      title: 'Dialog',
      component: lazy(() => import('./DialogStory')),
    },
    {
      name: 'menu-button',
      title: 'MenuButton',
      component: lazy(() => import('./MenuButtonStory')),
    },
    {
      name: 'menu-group',
      title: 'MenuGroup',
      component: lazy(() => import('./MenuGroupStory')),
    },
    {
      name: 'menu-item',
      title: 'MenuItem',
      component: lazy(() => import('./MenuItemStory')),
    },
    {
      name: 'popover',
      title: 'Popover',
      component: lazy(() => import('./PopoverStory')),
    },
    {
      name: 'tab',
      title: 'Tab',
      component: lazy(() => import('./TabStory')),
    },
    {
      name: 'tooltip',
      title: 'Tooltip',
      component: lazy(() => import('./TooltipStory')),
    },
    {
      name: 'tooltip-delay-group-provider',
      title: 'TooltipDelayGroupProvider',
      component: lazy(() => import('./TooltipDelayGroupProviderStory')),
    },
  ],
})
