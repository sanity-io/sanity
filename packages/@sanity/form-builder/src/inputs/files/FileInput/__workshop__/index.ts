import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/inputs/files/file', 'File', [
  {
    name: 'compact-file',
    title: 'Compact file',
    component: lazy(() => import('./compactFile.tsx')),
  },
])
