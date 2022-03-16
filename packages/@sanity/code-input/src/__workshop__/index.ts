import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('code-input', '@sanity/code-input', [
  {
    name: 'dev',
    title: 'Dev',
    component: lazy(() => import('./dev')),
  },
])
