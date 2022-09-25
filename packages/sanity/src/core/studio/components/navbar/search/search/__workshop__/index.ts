import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/search', 'Search', [
  {name: 'dev', title: 'Dev', component: lazy(() => import('./DevStory'))},
])
