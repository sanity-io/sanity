import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/form-field',
  title: 'FormField',
  stories: [
    {
      name: 'example',
      title: 'Example',
      component: lazy(() => import('./example')),
    },
  ],
})
