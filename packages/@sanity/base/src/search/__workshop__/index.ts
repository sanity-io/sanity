import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/search', 'Search', [
  {name: 'dev', title: 'Dev', component: lazy(() => import('./DevStory'))},
])
