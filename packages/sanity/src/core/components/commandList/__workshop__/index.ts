import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/command-list',
  title: 'CommandList',
  stories: [
    {
      name: 'command-list',
      title: 'Default',
      component: lazy(() => import('./CommandListStory')),
    },
  ],
})
