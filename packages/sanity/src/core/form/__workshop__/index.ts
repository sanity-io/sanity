import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/form/core',
  title: 'Core',
  stories: [
    {
      name: 'example',
      title: 'Example',
      component: lazy(() => import('./example')),
    },
    {
      name: 'form-builder',
      title: 'Form builder (unfinished)',
      component: lazy(() => import('./FormBuilderStory')),
    },
  ],
})
