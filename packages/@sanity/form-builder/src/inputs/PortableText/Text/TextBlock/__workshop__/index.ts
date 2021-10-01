import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/inputs/text-block', 'TextBlock', [
  {
    name: 'test',
    title: 'Test',
    component: lazy(() => import('./test')),
  },
])
