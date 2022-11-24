import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/components',
  title: 'Components',
  stories: [
    {
      name: 'user-avatar',
      title: 'UserAvatar',
      component: lazy(() => import('./UserAvatarStory')),
    },
    {
      name: 'text-with-tone',
      title: 'TextWithTone',
      component: lazy(() => import('./TextWithToneStory')),
    },
    {
      name: 'preview-card',
      title: 'PreviewCard',
      component: lazy(() => import('./PreviewCardStory')),
    },
    {
      name: 'collapse-menu',
      title: 'CollapseMenu',
      component: lazy(() => import('./CollapseMenuStory')),
    },
    {
      name: 'roving-focus',
      title: 'RovingFocus',
      component: lazy(() => import('./RovingFocusStory')),
    },
    {
      name: 'image',
      title: 'Image',
      component: lazy(() => import('./ImageStory')),
    },
  ],
})
