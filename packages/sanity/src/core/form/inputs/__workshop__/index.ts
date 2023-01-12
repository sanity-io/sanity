import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/form/inputs',
  title: 'Inputs',
  stories: [
    {
      name: 'tag-input',
      title: 'TagInput',
      component: lazy(() => import('./TagInputStory')),
    },
  ],
})
