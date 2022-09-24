import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/form-field', 'FormField', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
])
