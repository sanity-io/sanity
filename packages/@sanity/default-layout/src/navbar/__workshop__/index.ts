import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('@default-layout/navbar', 'Navbar', [
  {
    name: 'login-status',
    title: 'LoginStatus',
    component: lazy(() => import('./LoginStatusStory')),
  },
])
