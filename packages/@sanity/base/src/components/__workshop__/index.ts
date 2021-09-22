import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/components', 'components', [
  {
    name: 'user-avatar',
    title: 'UserAvatar',
    component: lazy(() => import('./UserAvatarStory')),
  },
  {
    name: 'collapse-menu',
    title: 'CollapseMenu',
    component: lazy(() => import('./CollapseMenuStory')),
  },
])
