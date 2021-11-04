import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/inputs/files/image', 'Image', [
  {
    name: 'compact-image',
    title: 'Compact image',
    component: lazy(() => import('./compactImage.tsx')),
  },
])
