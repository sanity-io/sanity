import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/form/core', 'Core', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
  {
    name: 'form-builder',
    title: 'Form builder',
    component: lazy(() => import('./FormBuilderStory')),
  },
])
