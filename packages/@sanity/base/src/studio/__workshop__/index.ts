import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/studio', 'Studio', [
  {
    name: 'navbar',
    title: 'Navbar',
    component: lazy(() => import('./NavbarStory')),
  },
])
