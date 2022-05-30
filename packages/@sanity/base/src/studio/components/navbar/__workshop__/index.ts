import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/studio/navbar', 'Navbar', [
  {
    name: 'navbar',
    title: 'Navbar',
    component: lazy(() => import('./NavbarStory')),
  },
])
