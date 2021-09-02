import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/formField', 'FormField', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
])
