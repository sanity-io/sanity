import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/inputs/pte', 'Portable Text Editor', [
  {
    name: 'default',
    title: 'Default Schema',
    component: lazy(() => import('./default/Story')),
  },
  {
    name: 'custom',
    title: 'Custom Schema',
    component: lazy(() => import('./custom/Story')),
  },
  {
    name: 'list-counter',
    title: 'List counter',
    component: lazy(() => import('./listCounter')),
  },
])
