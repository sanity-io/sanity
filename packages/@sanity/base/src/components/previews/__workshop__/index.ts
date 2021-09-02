import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/previews', 'Previews', [
  {name: 'example', title: 'Example', component: lazy(() => import('./example'))},
])
