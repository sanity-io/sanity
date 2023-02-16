import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/user-avatar',
  title: 'UserAvatar',
  stories: [
    {
      name: 'user-avatar',
      title: 'Default',
      component: lazy(() => import('./UserAvatarStory')),
    },
  ],
})
