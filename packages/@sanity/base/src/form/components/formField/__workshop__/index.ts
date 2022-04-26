import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/form-field', 'FormField', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
])
