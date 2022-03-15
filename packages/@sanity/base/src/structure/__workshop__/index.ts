import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/structure', 'Structure', [
  {
    name: 'structure',
    title: 'Structure',
    component: lazy(() => import('./StructureStory')),
  },
  {
    name: 'templates',
    title: 'Templates',
    component: lazy(() => import('./TemplatesStory')),
  },
])
