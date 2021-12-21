import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/FormBuilderInput', 'FormBuilderInput', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
])
