import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'studio-ui',
  title: 'Studio UI',
  stories: [
    {
      name: 'menu-item',
      title: 'MenuItem',
      component: lazy(() => import('./MenuItemStory')),
    },
    {
      name: 'preview-menu-item',
      title: 'PreviewMenuItem',
      component: lazy(() => import('./PreviewMenuItemStory')),
    },
  ],
})
