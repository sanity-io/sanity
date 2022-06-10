import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/form/reference-input', 'ReferenceInput', [
  {
    name: 'reference-input',
    title: 'Reference Input',
    component: lazy(() => import('./ReferenceInputStory')),
  },
])
