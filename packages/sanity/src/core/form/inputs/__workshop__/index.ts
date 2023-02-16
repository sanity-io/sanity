import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/form/inputs/array',
  title: 'Array',
  stories: [
    {
      name: 'tag-input',
      title: 'TagInput',
      component: lazy(() => import('./TagInputStory')),
    },
  ],
})
